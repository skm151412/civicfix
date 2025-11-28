import React from 'react';
import { motion } from 'framer-motion';
import { Handshake, Building2, Users, ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import PageWrapper from '../components/PageWrapper';
import Button from '../components/Button';
import Card from '../components/Card';

const CommunityPartner: React.FC = () => {
  return (
    <PageWrapper>
      <Navbar />
      <div className="min-h-screen pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-20"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-400 text-sm font-medium mb-6 border border-blue-500/20">
              Partner With Us
            </span>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Join the <span className="text-blue-500">CivicFix</span> Network
            </h1>
            <p className="text-slate-400 text-xl max-w-3xl mx-auto mb-10">
              Collaborate with local government and citizens to solve community issues faster and more efficiently.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="px-8">Become a Partner</Button>
              <Button size="lg" variant="secondary" className="px-8">View Current Partners</Button>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            <Card className="p-8">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-6">
                <Building2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Municipalities</h3>
              <p className="text-slate-400 mb-6">
                Streamline issue tracking and resolution for your city departments with our integrated dashboard.
              </p>
              <a href="#" className="text-blue-400 font-medium flex items-center gap-2 hover:gap-3 transition-all">
                Learn more <ArrowRight size={16} />
              </a>
            </Card>

            <Card className="p-8">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-6">
                <Handshake size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">NGOs & Non-Profits</h3>
              <p className="text-slate-400 mb-6">
                Coordinate volunteer efforts and resources to address community needs effectively.
              </p>
              <a href="#" className="text-emerald-400 font-medium flex items-center gap-2 hover:gap-3 transition-all">
                Learn more <ArrowRight size={16} />
              </a>
            </Card>

            <Card className="p-8">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-6">
                <Users size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Community Groups</h3>
              <p className="text-slate-400 mb-6">
                Empower neighborhood associations to take charge of their local environment.
              </p>
              <a href="#" className="text-purple-400 font-medium flex items-center gap-2 hover:gap-3 transition-all">
                Learn more <ArrowRight size={16} />
              </a>
            </Card>
          </div>

          <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-600/10 to-purple-600/10 z-0" />
            <div className="relative z-10">
              <h2 className="text-3xl font-bold text-white mb-6">Ready to make a difference?</h2>
              <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
                Join hundreds of organizations already using CivicFix to build better communities.
              </p>
              <Button size="lg" className="px-10">Get Started Today</Button>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default CommunityPartner;
