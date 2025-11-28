import React, { useEffect, useRef, useState } from 'react';
import { Paperclip, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import { Input, Select, TextArea } from '../components/Input';
import Card from '../components/Card';
import MainLayout from '../components/MainLayout';
import { createIssue, findNearbyDuplicateIssue, IssueRecord, IssuePayload, IssueSubmissionError } from '../services/issueService';
import { reverseGeocode } from '../services/geocoding';
import { queueIssueDraft } from '../services/offlineQueue';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';
import { getDistanceMeters } from '../utils/distance';
import { useModalAccessibility } from '../hooks/useModalAccessibility';

const categories = [
  { label: 'Pothole', value: 'Pothole' },
  { label: 'Garbage', value: 'Garbage' },
  { label: 'Streetlight', value: 'Streetlight' },
  { label: 'Water', value: 'Water' },
  { label: 'Other', value: 'Other' },
];

type AddressDetails = {
  fullAddress: string;
  street: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  landmark: string;
};

const initialAddressState: AddressDetails = {
  fullAddress: '',
  street: '',
  locality: '',
  city: '',
  state: '',
  pincode: '',
  country: '',
  landmark: '',
};

const ReportIssue: React.FC = () => {
  const [formValues, setFormValues] = useState({
    title: '',
    category: 'Pothole',
    description: '',
    locationText: '',
    fileName: '',
  });
  const [coords, setCoords] = useState<{ lat: number | null; lng: number | null }>({ lat: null, lng: null });
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [addressDetails, setAddressDetails] = useState<AddressDetails>({ ...initialAddressState });
  const [toast, setToast] = useState<{ message: string; variant: 'info' | 'success' | 'warning' | 'error' } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Aadhaar State
  const [aadharNumber, setAadharNumber] = useState('');
  const [aadharFormatted, setAadharFormatted] = useState('');
  const [aadharError, setAadharError] = useState<string | null>(null);
  const [aadharImage, setAadharImage] = useState<File | null>(null);
  const [aadharPreview, setAadharPreview] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [duplicateCandidate, setDuplicateCandidate] = useState<IssueRecord | null>(null);
  const [pendingSubmission, setPendingSubmission] = useState<{ payload: IssuePayload; file: File | null; aadharFile: File | null } | null>(null);
  const [duplicateDistance, setDuplicateDistance] = useState<number | null>(null);
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, isPhoneVerified, requirePhoneVerification } = useAuth();
  const showVerificationGate = !!user && !isPhoneVerified && !authLoading;
  const duplicateModalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  useEffect(() => {
    if (!aadharPreview) return;
    return () => URL.revokeObjectURL(aadharPreview);
  }, [aadharPreview]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = (message: string, variant: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setToast({ message, variant });
  };

  const resetForm = () => {
    setFormValues({ title: '', category: 'Pothole', description: '', locationText: '', fileName: '' });
    setCoords({ lat: null, lng: null });
    setAddressDetails({ ...initialAddressState });
    setLocationError(null);
    setAddressError(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    setAadharNumber('');
    setAadharFormatted('');
    setAadharError(null);
    setAadharImage(null);
    setAadharPreview(null);
  };

  const buildIssuePayload = () => {
    if (!formValues.title || !formValues.description) {
      showToast('Please fill all required fields.', 'warning');
      return null;
    }

    if (coords.lat === null || coords.lng === null) {
      showToast('Capture your GPS location before submitting.', 'warning');
      return null;
    }

    const resolvedFullAddress = (addressDetails.fullAddress || formValues.locationText).trim();
    if (!resolvedFullAddress) {
      showToast('Please capture or enter your full address.', 'warning');
      return null;
    }

    const requiredAddressKeys: Array<keyof AddressDetails> = ['city', 'state', 'pincode', 'country'];
    const missingChunks = requiredAddressKeys.filter((key) => !addressDetails[key]?.trim());
    if (missingChunks.length) {
      showToast('Please complete city, state, pincode, and country fields.', 'warning');
      return null;
    }

    if (aadharNumber && aadharNumber.length !== 12) {
      setAadharError('Aadhaar must be 12 digits');
      showToast('Please fix Aadhaar errors.', 'warning');
      return null;
    }

    return {
      title: formValues.title,
      category: formValues.category,
      description: formValues.description,
      locationText: resolvedFullAddress,
      fullAddress: resolvedFullAddress,
      street: addressDetails.street.trim() || undefined,
      locality: addressDetails.locality.trim() || undefined,
      city: addressDetails.city.trim(),
      state: addressDetails.state.trim(),
      pincode: addressDetails.pincode.trim(),
      country: addressDetails.country.trim(),
      landmark: addressDetails.landmark.trim() || undefined,
      lat: coords.lat,
      lng: coords.lng,
      userId: user?.uid || '',
      phoneVerified: !!profile?.phoneVerified,
      aadharNumber: aadharNumber || undefined,
    };
  };

  const handleChange = (key: keyof typeof formValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormValues((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleAddressChange = (field: keyof AddressDetails) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAddressDetails((prev) => ({ ...prev, [field]: value }));
    if (field === 'fullAddress') {
      setFormValues((prev) => ({ ...prev, locationText: value }));
    }
  };

  const handleAadharInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 12);
    setAadharNumber(raw);

    // Format: XXXX XXXX XXXX
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
    setAadharFormatted(formatted);

    if (raw.length > 0 && raw.length < 12) {
      setAadharError('Aadhaar must be 12 digits');
    } else {
      setAadharError(null);
    }
  };

  const handleAadharUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && !file.type.startsWith('image/')) {
      showToast('Only image files are allowed.', 'warning');
      e.target.value = '';
      return;
    }
    if (file) {
      setAadharImage(file);
      setAadharPreview(URL.createObjectURL(file));
    }
  };

  const removeAadharPreview = () => {
    setAadharImage(null);
    setAadharPreview(null);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setLocating(true);
    setLocationError(null);
    setAddressError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const nextCoords = { lat: position.coords.latitude, lng: position.coords.longitude };
        setCoords(nextCoords);
        try {
          const details = await reverseGeocode(nextCoords.lat, nextCoords.lng);
          setAddressDetails({
            fullAddress: details.fullAddress ?? '',
            street: details.street ?? '',
            locality: details.locality ?? '',
            city: details.city ?? '',
            state: details.state ?? '',
            pincode: details.pincode ?? '',
            country: details.country ?? '',
            landmark: details.landmark ?? '',
          });
          if (details.fullAddress) {
            setFormValues((prev) => ({ ...prev, locationText: details.fullAddress ?? prev.locationText }));
          }
        } catch (err) {
          console.error('Reverse geocoding failed', err);
          setAddressError('Unable to retrieve address details. Please fill manually.');
        } finally {
          setLocating(false);
        }
      },
      (error) => {
        console.error('Geolocation failed', error);
        setLocationError('Unable to fetch your location. Please allow location access and try again.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file && !['image/jpeg', 'image/png'].includes(file.type)) {
      showToast('Only JPEG or PNG images are allowed.', 'warning');
      e.target.value = '';
      return;
    }

    setSelectedFile(file || null);
    setFormValues((prev) => ({ ...prev, fileName: file ? file.name : '' }));
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  };

  const submitPayload = async (payload: IssuePayload, file: File | null, aadharFile: File | null) => {
    const isOnline = typeof navigator === 'undefined' ? true : navigator.onLine;

    if (!isOnline) {
      try {
        // Note: Offline queue might need update to support aadharFile if needed, 
        // but for now we just pass the main file as before or update queueIssueDraft signature.
        // Assuming queueIssueDraft only takes one file for now.
        await queueIssueDraft(payload, file);
        showToast("You're offline, your report is saved and will auto-submit when you reconnect.", 'info');
        resetForm();
      } catch (err) {
        console.error('Failed to queue offline issue', err);
        showToast('Unable to save your report offline. Please try again.', 'error');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    showToast('Submitting, please wait...', 'info');

    try {
      await createIssue(payload, file, aadharFile);

      resetForm();
      showToast('Issue submitted successfully!', 'success');

      setTimeout(() => {
        navigate('/citizen/issues');
      }, 1500);
    } catch (submissionError) {
      console.error('Failed to submit issue', submissionError);
      if (submissionError instanceof IssueSubmissionError) {
        const friendlyMessage =
          submissionError.code === 'storage-upload-failed'
            ? 'Photo upload failed. Check your connection or try a smaller image, then submit again.'
            : 'We could not save your report yet. Please retry in a moment.';
        showToast(friendlyMessage, 'error');
      } else {
        showToast('Unable to submit issue right now. Please try again.', 'error');
      }
    } finally {
      setIsSubmitting(false);
      setPendingSubmission(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('Please log in to submit an issue.', 'warning');
      return;
    }
    if (!isPhoneVerified) {
      showToast('Please verify your phone before submitting.', 'warning');
      requirePhoneVerification();
      return;
    }
    setIsSubmitting(true);
    const payload = buildIssuePayload();
    if (!payload) {
      setIsSubmitting(false);
      return;
    }

    setPendingSubmission({ payload, file: selectedFile, aadharFile: aadharImage });

    const canCheckDuplicates = typeof navigator === 'undefined' ? true : navigator.onLine;
    if (
      canCheckDuplicates &&
      typeof payload.lat === 'number' &&
      typeof payload.lng === 'number'
    ) {
      try {
        const duplicate = await findNearbyDuplicateIssue({
          category: payload.category,
          lat: payload.lat,
          lng: payload.lng,
        });
        if (duplicate) {
          if (
            typeof payload.lat === 'number' &&
            typeof payload.lng === 'number' &&
            typeof duplicate.lat === 'number' &&
            typeof duplicate.lng === 'number'
          ) {
            setDuplicateDistance(
              Math.round(
                getDistanceMeters(
                  { lat: payload.lat, lng: payload.lng },
                  { lat: duplicate.lat, lng: duplicate.lng }
                )
              )
            );
          } else {
            setDuplicateDistance(null);
          }
          setDuplicateCandidate(duplicate);
          setIsSubmitting(false);
          return;
        }
      } catch (err) {
        console.warn('Duplicate detection failed', err);
      }
    }

    await submitPayload(payload, selectedFile, aadharImage);
  };

  const handleSaveDraft = async () => {
    if (!user) {
      showToast('Please log in to save drafts.', 'warning');
      return;
    }
    if (!isPhoneVerified) {
      showToast('Verify your phone before saving drafts.', 'warning');
      requirePhoneVerification();
      return;
    }

    const payload = buildIssuePayload();
    if (!payload) {
      return;
    }

    try {
      await queueIssueDraft(payload, selectedFile);
      showToast('Draft saved offline. It will send automatically when you reconnect.', 'success');
      resetForm();
    } catch (err) {
      console.error('Failed to store draft', err);
      showToast('Unable to save draft locally.', 'error');
    }
  };

  const handleProceedDespiteDuplicate = async () => {
    if (!pendingSubmission) {
      setDuplicateCandidate(null);
      return;
    }
    setDuplicateCandidate(null);
    setDuplicateDistance(null);
    setIsSubmitting(true);
    await submitPayload(pendingSubmission.payload, pendingSubmission.file, pendingSubmission.aadharFile);
  };

  const handleDismissDuplicate = () => {
    setDuplicateCandidate(null);
    setDuplicateDistance(null);
    setPendingSubmission(null);
    setIsSubmitting(false);
  };

  const handleNavigateToDuplicate = () => {
    if (!duplicateCandidate) return;
    const targetId = duplicateCandidate.id;
    handleDismissDuplicate();
    navigate(`/issues/${targetId}`);
  };

  useModalAccessibility(Boolean(duplicateCandidate && pendingSubmission), duplicateModalRef, {
    onClose: handleDismissDuplicate,
  });

  return (
    <MainLayout>
      <div className="max-w-3xl space-y-6">
        <div>
          <p className="text-sm text-slate-400">Have something to report?</p>
          <h1 className="text-3xl font-semibold text-white">Create a new issue</h1>
        </div>

        {showVerificationGate ? (
          <Card className="p-6 text-center bg-white/5 border-white/10">
            <div className="space-y-4">
              <p className="text-sm text-slate-400">Safety first</p>
              <h2 className="text-2xl font-semibold text-white">Verify your phone to report</h2>
              <p className="text-slate-400">
                To keep CivicFix free of spam, please complete a quick phone verification before submitting new issues.
              </p>
              <div className="flex items-center justify-center">
                <Button type="button" onClick={requirePhoneVerification} disabled={authLoading}>
                  Verify Phone Now
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="bg-white/5 border-white/10">
            <form className="space-y-5" onSubmit={handleSubmit}>
              <Input
                label="Title"
                placeholder="Large pothole on Main Street"
                value={formValues.title}
                onChange={handleChange('title')}
                data-testid="report-title"
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Category"
                  options={categories}
                  value={formValues.category}
                  onChange={handleChange('category')}
                  data-testid="report-category"
                />
                <Input
                  label="Full address"
                  placeholder="Apartment, street, area"
                  value={addressDetails.fullAddress}
                  onChange={handleAddressChange('fullAddress')}
                  data-testid="report-full-address"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Street"
                  placeholder="Street name"
                  value={addressDetails.street}
                  onChange={handleAddressChange('street')}
                  data-testid="report-street"
                />
                <Input
                  label="Locality / Area"
                  placeholder="e.g., Indiranagar"
                  value={addressDetails.locality}
                  onChange={handleAddressChange('locality')}
                  data-testid="report-locality"
                />
              </div>

              <Input
                label="Landmark (optional)"
                placeholder="Near what landmark?"
                value={addressDetails.landmark}
                onChange={handleAddressChange('landmark')}
                data-testid="report-landmark"
              />

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input
                  label="City"
                  placeholder="City"
                  value={addressDetails.city}
                  onChange={handleAddressChange('city')}
                  data-testid="report-city"
                  required
                />
                <Input
                  label="State"
                  placeholder="State"
                  value={addressDetails.state}
                  onChange={handleAddressChange('state')}
                  data-testid="report-state"
                  required
                />
                <Input
                  label="Pincode"
                  placeholder="Postal code"
                  value={addressDetails.pincode}
                  onChange={handleAddressChange('pincode')}
                  data-testid="report-pincode"
                  required
                />
                <Input
                  label="Country"
                  placeholder="Country"
                  value={addressDetails.country}
                  onChange={handleAddressChange('country')}
                  data-testid="report-country"
                  required
                />
              </div>

              <div className="rounded-2xl border border-dashed border-white/15 bg-slate-900/40 p-4 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-200">GPS Coordinates</p>
                    <p className="text-xs text-slate-400">Capture your current location for faster routing.</p>
                  </div>
                  <Button type="button" variant="secondary" onClick={handleGetLocation} disabled={locating}>
                    {locating ? 'Locating…' : '📍 Get Location'}
                  </Button>
                </div>
                <div
                  className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300 space-y-1"
                  data-testid="location-summary"
                >
                  {locating ? (
                    <span>Detecting your precise address…</span>
                  ) : addressDetails.fullAddress ? (
                    <>
                      <p className="text-base font-semibold text-white">
                        {addressDetails.locality || addressDetails.city || 'Detected location'}
                      </p>
                      <p className="text-sm text-slate-300">{addressDetails.fullAddress}</p>
                      <p className="text-xs text-slate-500">
                        {[addressDetails.city, addressDetails.state].filter(Boolean).join(', ')}
                        {addressDetails.pincode ? ` · ${addressDetails.pincode}` : ''}
                        {addressDetails.country ? ` · ${addressDetails.country}` : ''}
                      </p>
                      {addressDetails.landmark && (
                        <p className="text-xs text-slate-400">Landmark: {addressDetails.landmark}</p>
                      )}
                      {coords.lat !== null && coords.lng !== null && (
                        <>
                          <p className="text-xs text-emerald-300">GPS locked for this address</p>
                          <p className="text-xs text-slate-500">
                            Lat: {coords.lat.toFixed(5)} · Lng: {coords.lng.toFixed(5)}
                          </p>
                        </>
                      )}
                    </>
                  ) : coords.lat !== null && coords.lng !== null ? (
                    <div className="space-y-1">
                      <span>Location captured. Finalizing address…</span>
                      <p className="text-xs text-slate-500">
                        Lat: {coords.lat.toFixed(5)} · Lng: {coords.lng.toFixed(5)}
                      </p>
                    </div>
                  ) : (
                    <span>No precise address captured yet. Use Get Location to autofill every field.</span>
                  )}
                </div>
                {locationError && <p className="text-xs text-red-300">{locationError}</p>}
                {addressError && <p className="text-xs text-amber-300">{addressError}</p>}
              </div>

              <TextArea
                label="Description"
                rows={4}
                placeholder="Provide any extra context that helps staff resolve the issue quickly."
                value={formValues.description}
                onChange={handleChange('description')}
                data-testid="report-description"
                required
              />

              <div className="space-y-4 pt-2 border-t border-white/10">
                <h3 className="text-lg font-medium text-white">Identity Verification</h3>
                
                <Input
                  label="Aadhaar Number"
                  placeholder="XXXX XXXX XXXX"
                  value={aadharFormatted}
                  onChange={handleAadharInput}
                  maxLength={14}
                  error={aadharError || undefined}
                  data-testid="report-aadhar-number"
                />

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Upload Aadhaar Card (Front/Back)</label>
                  <label className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-dashed border-white/20 bg-slate-900/40 cursor-pointer hover:bg-slate-900/60 transition-colors">
                    <Paperclip size={18} className="text-slate-400" />
                    <span className="text-sm text-slate-300">
                      {aadharImage ? aadharImage.name : 'Upload Aadhaar image'}
                    </span>
                    <input
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      onChange={handleAadharUpload}
                      data-testid="report-aadhar-upload"
                    />
                  </label>
                  
                  {aadharPreview && (
                    <div className="mt-3 relative rounded-2xl border border-white/10 bg-slate-900/40 p-3 inline-block">
                      <button
                        type="button"
                        onClick={removeAadharPreview}
                        className="absolute -top-2 -right-2 bg-slate-800 text-white rounded-full p-1 border border-white/20 hover:bg-slate-700"
                        aria-label="Remove Aadhaar preview"
                      >
                        <X size={14} />
                      </button>
                      <p className="text-xs text-slate-400 mb-2">Aadhaar Preview</p>
                      <img 
                        src={aadharPreview} 
                        alt="Aadhaar Preview" 
                        className="rounded-xl object-cover max-h-40" 
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Attach Photo</label>
                <label className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-dashed border-white/20 bg-slate-900/40 cursor-pointer">
                  <Paperclip size={18} className="text-slate-400" />
                  <span className="text-sm text-slate-300">{formValues.fileName || 'Upload supporting image (optional)'}</span>
                  <input
                    type="file"
                    className="sr-only"
                    accept="image/png, image/jpeg"
                    onChange={handleFile}
                    data-testid="report-file-input"
                  />
                </label>
                {previewUrl && (
                  <div className="mt-3 rounded-2xl border border-white/10 bg-slate-900/40 p-3">
                    <p className="text-xs text-slate-400 mb-2">Preview</p>
                    <img src={previewUrl} alt="Selected attachment" className="w-full rounded-xl object-cover max-h-64" />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-4 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="bg-transparent text-slate-300 border border-white/15 hover:bg-white/10"
                  onClick={handleSaveDraft}
                >
                  Save draft
                </Button>
                <Button type="submit" disabled={isSubmitting || authLoading || !user}>
                  {isSubmitting ? 'Submitting...' : 'Submit Issue'}
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>
      {toast && (
        <div className="fixed bottom-6 right-6">
          <Toast message={toast.message} variant={toast.variant} />
        </div>
      )}
      {duplicateCandidate && pendingSubmission && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card
            ref={duplicateModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="duplicate-modal-title"
            aria-describedby="duplicate-modal-description"
            className="w-full max-w-lg bg-slate-900/90 border-white/10 space-y-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Possible duplicate</p>
                <h3 id="duplicate-modal-title" className="text-2xl text-white font-semibold mt-1">
                  Someone already reported this spot
                </h3>
              </div>
              <button
                type="button"
                onClick={handleDismissDuplicate}
                className="text-slate-400 hover:text-white"
                aria-label="Close duplicate warning"
              >
                &times;
              </button>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 space-y-2">
              <p className="text-sm text-slate-400">{duplicateCandidate.category}</p>
              <p className="text-lg font-semibold text-white">{duplicateCandidate.title}</p>
              <p className="text-sm text-slate-400">Status: {duplicateCandidate.status}</p>
              {duplicateDistance !== null && (
                <p className="text-xs text-slate-500">≈ {duplicateDistance}m from your location</p>
              )}
            </div>
            <p id="duplicate-modal-description" className="text-sm text-slate-400">
              Upvote the existing issue so staff can prioritize it faster, or continue to create a new report anyway.
            </p>
            <div className="flex flex-col gap-3 md:flex-row">
              <Button
                type="button"
                variant="secondary"
                className="flex-1 border-white/20 text-white"
                onClick={handleNavigateToDuplicate}
              >
                View existing issue
              </Button>
              <Button type="button" className="flex-1" onClick={handleProceedDespiteDuplicate}>
                Create anyway
              </Button>
            </div>
            <Button
              type="button"
              variant="secondary"
              className="w-full border-white/20 text-slate-200"
              onClick={handleDismissDuplicate}
            >
              Cancel
            </Button>
          </Card>
        </div>
      )}
    </MainLayout>
  );
};

export default ReportIssue;