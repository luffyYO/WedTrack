import React from 'react';

const PrivacyPolicy: React.FC = () => {
    return (
        <div className="min-h-screen pt-24 pb-12 px-4 animate-fade-up">
            <div className="max-w-4xl mx-auto glass-panel p-8 sm:p-12 rounded-3xl space-y-8">
                <header className="text-center space-y-2">
                    <h1 className="text-4xl font-bold text-slate-800 tracking-tight">Privacy Policy</h1>
                    <p className="text-slate-500">Last updated: {new Date().toLocaleDateString()}</p>
                </header>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-slate-800">1. Introduction</h2>
                    <p className="text-slate-600 leading-relaxed">
                        Welcome to WedTrack. We respect your privacy and are committed to protecting your personal data. 
                        This privacy policy will inform you as to how we look after your personal data when you visit 
                        our website and tell you about your privacy rights and how the law protects you.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-slate-800">2. The Data We Collect</h2>
                    <p className="text-slate-600 leading-relaxed">
                        We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
                    </p>
                    <ul className="list-disc pl-6 text-slate-600 space-y-2">
                        <li><strong>Identity Data</strong> includes first name, last name, and username.</li>
                        <li><strong>Contact Data</strong> includes email address and telephone numbers.</li>
                        <li><strong>Wedding Data</strong> includes event dates, locations, and guest lists.</li>
                        <li><strong>Technical Data</strong> includes internet protocol (IP) address, browser type and version, and time zone setting.</li>
                    </ul>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-slate-800">3. How We Use Your Data</h2>
                    <p className="text-slate-600 leading-relaxed">
                        We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
                    </p>
                    <ul className="list-disc pl-6 text-slate-600 space-y-2">
                        <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
                        <li>Where it is necessary for our legitimate interests and your interests and fundamental rights do not override those interests.</li>
                        <li>Where we need to comply with a legal obligation.</li>
                    </ul>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-slate-800">4. Data Security</h2>
                    <p className="text-slate-600 leading-relaxed">
                        We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed. We use Supabase for secure data storage and authentication.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-slate-800">5. Your Legal Rights</h2>
                    <p className="text-slate-600 leading-relaxed">
                        Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to request access, correction, erasure, or restriction of processing of your personal data.
                    </p>
                </section>

                <footer className="pt-8 border-t border-slate-100 text-center">
                    <p className="text-slate-500">If you have any questions about this privacy policy, please contact us at support@wedtrackss.in</p>
                </footer>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
