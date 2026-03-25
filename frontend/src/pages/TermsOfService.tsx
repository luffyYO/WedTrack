import React from 'react';

const TermsOfService: React.FC = () => {
    return (
        <div className="min-h-screen pt-24 pb-12 px-4 animate-fade-up">
            <div className="max-w-4xl mx-auto glass-panel p-8 sm:p-12 rounded-3xl space-y-8">
                <header className="text-center space-y-2">
                    <h1 className="text-4xl font-bold text-slate-800 tracking-tight">Terms of Service</h1>
                    <p className="text-slate-500">Last updated: {new Date().toLocaleDateString()}</p>
                </header>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-slate-800">1. Acceptance of Terms</h2>
                    <p className="text-slate-600 leading-relaxed">
                        By accessing and using WedTrack, you agree to be bound by these Terms of Service. 
                        If you do not agree with any part of these terms, you may not use our services.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-slate-800">2. Description of Service</h2>
                    <p className="text-slate-600 leading-relaxed">
                        WedTrack provides a platform for managing wedding events, gift tracking, and guest management. We reserve the right to modify or discontinue any aspect of the service at any time without prior notice.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-slate-800">3. User Obligations</h2>
                    <p className="text-slate-600 leading-relaxed">
                        You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to:
                    </p>
                    <ul className="list-disc pl-6 text-slate-600 space-y-2">
                        <li>Provide accurate and complete information.</li>
                        <li>Not use the service for any illegal or unauthorized purpose.</li>
                        <li>Not attempt to interfere with the proper working of the service.</li>
                    </ul>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-slate-800">4. Intellectual Property</h2>
                    <p className="text-slate-600 leading-relaxed">
                        The service and its original content, features, and functionality are and will remain the exclusive property of WedTrack and its licensors.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-slate-800">5. Limitation of Liability</h2>
                    <p className="text-slate-600 leading-relaxed">
                        In no event shall WedTrack be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, or other intangible losses, arising out of your use of the service.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-slate-800">6. Governing Law</h2>
                    <p className="text-slate-600 leading-relaxed">
                        These Terms shall be governed and construed in accordance with the laws of India, without regard to its conflict of law provisions.
                    </p>
                </section>

                <footer className="pt-8 border-t border-slate-100 text-center">
                    <p className="text-slate-500">For any inquiries regarding these terms, please contact us at legal@wedtrackss.in</p>
                </footer>
            </div>
        </div>
    );
};

export default TermsOfService;
