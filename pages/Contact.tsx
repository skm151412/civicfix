import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import Navbar from '../components/Navbar';
import PageWrapper from '../components/PageWrapper';
import Button from '../components/Button';
import { Input } from '../components/Input';

const Contact: React.FC = () => {
  return (
    <PageWrapper>
      <Navbar />
      <div className="min-h-screen pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Get in Touch</h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Have questions about CivicFix? We're here to help you build a better community.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-8"
            >
              <div className="bg-slate-900/50 border border-white/5 p-8 rounded-2xl backdrop-blur-sm">
                <h3 className="text-2xl font-semibold text-white mb-6">Contact Information</h3>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                      <Mail size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Email Us</p>
                      <a href="mailto:support@civicfix.com" className="text-white hover:text-blue-400 transition-colors">
                        support@civicfix.com
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                      <Phone size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Call Us</p>
                      <a href="tel:+1234567890" className="text-white hover:text-emerald-400 transition-colors">
                        +1 (555) 123-4567
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Visit Us</p>
                      <p className="text-white">
                        123 Civic Plaza, Suite 100<br />
                        Metropolis, ST 12345
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-slate-900/50 border border-white/5 p-8 rounded-2xl backdrop-blur-sm"
            >
              <h3 className="text-2xl font-semibold text-white mb-6">Send us a Message</h3>
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="First Name" placeholder="John" />
                  <Input label="Last Name" placeholder="Doe" />
                </div>
                <Input label="Email Address" type="email" placeholder="john@example.com" />
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-300">Message</label>
                  <textarea 
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all min-h-[120px] resize-y"
                    placeholder="How can we help you?"
                  />
                </div>
                <Button className="w-full justify-center gap-2 mt-2">
                  <Send size={18} />
                  Send Message
                </Button>
              </form>
            </motion.div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default Contact;
