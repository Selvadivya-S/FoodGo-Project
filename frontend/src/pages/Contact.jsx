import React, { useState } from "react";
import {
  FaEnvelope,
  FaMapMarkerAlt,
  FaPhone,
  FaClock,
  FaArrowRight,
} from "react-icons/fa";

export default function Contact() {
  const [sent, setSent] = useState(false);

  return (
    <section className="fg-page">
      <div className="fg-shell">

        {/* Page heading */}
        <div className="fg-page-title">
          <span className="fg-section-kicker">
            SUPPORT
          </span>

          <h1>How can we help?</h1>

          <p>
            Questions about orders, restaurants or
            partnerships? Our team is here.
          </p>
        </div>

        <div className="contact-modern">

          {/* Contact information */}
          <div className="contact-cards">
            {[
              [
                FaEnvelope,
                "Email",
                "support@foodgo.com",
              ],
              [
                FaPhone,
                "Phone",
                "+91 98765 43210",
              ],
              [
                FaMapMarkerAlt,
                "Office",
                "Chennai, Tamil Nadu",
              ],
              [
                FaClock,
                "Hours",
                "8 AM – 11 PM daily",
              ],
            ].map(([Icon, title, value]) => (
              <div key={title}>
                <Icon />

                <span>
                  <b>{title}</b>
                  <small>{value}</small>
                </span>
              </div>
            ))}
          </div>

          {/* Contact form */}
          <div className="fg-form-card">
            {sent ? (
              <div className="fg-success-small">
                ✓ Message sent. We'll get back to you
                shortly.
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSent(true);
                }}
              >
                <div className="fg-form-grid">

                  {/* Name */}
                  <label>
                    Name

                    <input
                      required
                      placeholder="Your name"
                    />
                  </label>

                  {/* Email */}
                  <label>
                    Email

                    <input
                      required
                      type="email"
                      placeholder="you@example.com"
                    />
                  </label>

                  {/* Subject */}
                  <label className="wide">
                    Subject

                    <input
                      required
                      placeholder="How can we help?"
                    />
                  </label>

                  {/* Message */}
                  <label className="wide">
                    Message

                    <textarea
                      required
                      rows="6"
                      placeholder="Tell us what happened..."
                    />
                  </label>

                </div>

                <button
                  type="submit"
                  className="fg-btn fg-btn-primary"
                >
                  Send message <FaArrowRight />
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}