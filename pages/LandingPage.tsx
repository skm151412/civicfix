import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, MapPin, TrendingUp, ArrowRight, Shield, Users, Smartphone } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import PageWrapper from '../components/PageWrapper';
import Navbar from '../components/Navbar';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <PageWrapper>
      <Navbar />
      <div className="relative min-h-screen flex flex-col overflow-hidden pt-20">
        
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <motion.div 
            animate={{ 
              x: [0, 100, 0],
              y: [0, 50, 0],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/20 blur-[100px]" 
          />
          <motion.div 
            animate={{ 
              x: [0, -50, 0],
              y: [0, 100, 0],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-green-500/10 blur-[120px]" 
          />
        </div>

        <div className="container mx-auto px-4 relative z-10 py-12 md:py-20">
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="max-w-4xl mx-auto text-center mb-24"
          >
            <motion.div variants={item} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-medium text-slate-300">Live in 50+ Cities</span>
            </motion.div>
            
            <motion.h1 variants={item} className="text-5xl md:text-7xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-slate-300 leading-tight">
              Make Your City Better, <br /> One Report at a Time.
            </motion.h1>
            
            <motion.p variants={item} className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              CivicFix empowers citizens to report local issues, track progress in real-time, and help authorities build safer, cleaner communities.
            </motion.p>
            
            <motion.div variants={item} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => navigate('/login')} 
                className="text-lg px-8 py-4 shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:shadow-[0_0_40px_rgba(37,99,235,0.5)]"
              >
                Report an Issue
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => navigate('/citizen/dashboard')} 
                className="text-lg px-8 py-4 bg-white/5 hover:bg-white/10 border-white/10"
              >
                Track Status
              </Button>
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-32"
          >
            <Card hoverEffect className="border-t-4 border-t-blue-500 p-8 bg-slate-900/50 backdrop-blur-sm">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-6 text-blue-400">
                <Smartphone size={28} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Easy Reporting</h3>
              <p className="text-slate-400 leading-relaxed">
                Snap a photo, set location, and describe the issue in seconds directly from your phone.
              </p>
            </Card>

            <Card hoverEffect className="border-t-4 border-t-emerald-500 p-8 bg-slate-900/50 backdrop-blur-sm">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-6 text-emerald-400">
                <TrendingUp size={28} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Real-time Tracking</h3>
              <p className="text-slate-400 leading-relaxed">
                Get instant updates on your reports and see when they are resolved by authorities.
              </p>
            </Card>

            <Card hoverEffect className="border-t-4 border-t-purple-500 p-8 bg-slate-900/50 backdrop-blur-sm">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-6 text-purple-400">
                <Users size={28} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Community Impact</h3>
              <p className="text-slate-400 leading-relaxed">
                Join your neighbors in making your city a better place to live for everyone.
              </p>
            </Card>
          </motion.div>

          {/* Features Section */}
          <div className="max-w-6xl mx-auto mb-32">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                  Transparent & Efficient <br />
                  <span className="text-blue-500">Civic Management</span>
                </h2>
                <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                  CivicFix bridges the gap between citizens and local administration. We provide a transparent platform where every voice is heard and every issue is accounted for.
                </p>
                <ul className="space-y-4">
                  {[
                    'Direct connection to city officials',
                    'GPS-tagged issue reporting',
                    'Automated status notifications',
                    'Public heatmap of resolved issues'
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-300">
                      <CheckCircle2 className="text-emerald-500" size={20} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-blue-500/20 blur-[80px] rounded-full" />
                <div className="relative bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl">
                  {/* Mock UI for visual interest */}
                  <div className="flex items-center gap-4 mb-6 border-b border-white/5 pb-4">
                    <div className="w-10 h-10 rounded-full bg-slate-800" />
                    <div className="space-y-2">
                      <div className="h-2 w-32 bg-slate-800 rounded" />
                      <div className="h-2 w-20 bg-slate-800 rounded" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="h-32 w-full bg-slate-800/50 rounded-xl" />
                    <div className="h-4 w-3/4 bg-slate-800 rounded" />
                    <div className="h-4 w-1/2 bg-slate-800 rounded" />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto bg-gradient-to-b from-blue-900/20 to-slate-900/20 border border-blue-500/20 rounded-3xl p-12 backdrop-blur-sm"
          >
            <h2 className="text-3xl font-bold text-white mb-6">Ready to make a change?</h2>
            <p className="text-slate-400 mb-8 text-lg">
              Join thousands of active citizens contributing to their community today.
            </p>
            <Button onClick={() => navigate('/register')} size="lg" className="px-10">
              Get Started Now
            </Button>
          </motion.div>

        </div>
      </div>
    </PageWrapper>
  );
};

export default LandingPage;