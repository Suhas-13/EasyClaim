import React from "react";
import Navbar from "../components/Navbar";

const Home: React.FC = () => {
  return (
    <div className="h-screen bg-slate-950 text-slate-200 font-sans">
      {/* Navbar */}
      <Navbar />

      {/* Main content area */}
      <div className="flex flex-col items-center justify-center space-y-10 p-12">
        {/* Hero Section */}
        <div className="text-center max-w-4xl">
          <h1 className="text-5xl font-extrabold text-slate-200 mb-4">
            Automating Refunds with AI
          </h1>
          <p className="text-xl text-slate-400 mb-6">
            We automatically handle refund requests for payment companies using AI technology, making the process fast, accurate, and hassle-free.
          </p>
          <div className="flex justify-center gap-4">
            <a
              href="#features"
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200"
            >
              Get Started
            </a>
            <a
              href="#contact"
              className="bg-transparent border-2 border-indigo-500 hover:bg-indigo-500 hover:text-white text-indigo-500 px-8 py-3 rounded-lg font-medium transition-all duration-200"
            >
              Contact Us
            </a>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="w-full bg-slate-800 py-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-200">Our Features</h2>
            <p className="text-slate-400 text-lg">Discover how our AI-powered service simplifies the refund process.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-6">
            {/* Feature 1 */}
            <div className="bg-slate-700 p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-2xl font-semibold text-slate-200 mb-4">AI-Powered Automation</h3>
              <p className="text-slate-400">
                Our AI engine automates refund requests, making the process quicker, reducing human error, and ensuring efficiency.
              </p>
            </div>
            {/* Feature 2 */}
            <div className="bg-slate-700 p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-2xl font-semibold text-slate-200 mb-4">Real-Time Processing</h3>
              <p className="text-slate-400">
                Refunds are processed in real-time, with immediate status updates and notifications for both businesses and customers.
              </p>
            </div>
            {/* Feature 3 */}
            <div className="bg-slate-700 p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-2xl font-semibold text-slate-200 mb-4">Seamless Integration</h3>
              <p className="text-slate-400">
                Easily integrate our service into your existing payment systems, ensuring a smooth user experience.
              </p>
            </div>
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="w-full py-16 bg-slate-950">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-200">What Our Clients Say</h2>
            <p className="text-slate-400 text-lg">Hear from payment companies benefiting from our AI-powered refund automation.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            {/* Testimonial 1 */}
            <div className="bg-slate-800 p-8 rounded-lg shadow-lg w-full md:w-1/3 text-center">
              <p className="text-slate-400 mb-4">
                “The automation has saved us countless hours of manual work. AI has made the refund process seamless.”
              </p>
              <h4 className="text-slate-200 font-semibold">John Doe</h4>
              <p className="text-slate-400 text-sm">CEO, PaymentCo</p>
            </div>
            {/* Testimonial 2 */}
            <div className="bg-slate-800 p-8 rounded-lg shadow-lg w-full md:w-1/3 text-center">
              <p className="text-slate-400 mb-4">
                “Our refund process is now faster and more accurate, all thanks to the incredible AI engine.”
              </p>
              <h4 className="text-slate-200 font-semibold">Jane Smith</h4>
              <p className="text-slate-400 text-sm">COO, PayHub</p>
            </div>
            {/* Testimonial 3 */}
            <div className="bg-slate-800 p-8 rounded-lg shadow-lg w-full md:w-1/3 text-center">
              <p className="text-slate-400 mb-4">
                “Implementing this AI solution was a game changer for us. Refunds are processed in minutes, not days.”
              </p>
              <h4 className="text-slate-200 font-semibold">Mark Johnson</h4>
              <p className="text-slate-400 text-sm">CTO, FastPay</p>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div id="contact" className="w-full py-16 bg-slate-800">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-200">Get in Touch</h2>
            <p className="text-slate-400 text-lg">Want to learn more about our AI-powered refund automation? Reach out to us!</p>
          </div>
          <div className="flex justify-center">
            <a
              href="mailto:contact@oursite.com"
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200"
            >
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
