import React from "react";
import { Link } from "react-router-dom";
import {
  FaInstagram, FaFacebookF, FaTwitter, FaApple, FaGooglePlay,
  FaEnvelope, FaPhone, FaMapMarkerAlt, FaMotorcycle, FaStar,
  FaArrowRight, FaHeart
} from "react-icons/fa";

const explore = [
  ["Restaurants", "/restaurants"],
  ["My Orders", "/orders"],
  ["About FoodGo", "/about"],
  ["Contact", "/contact"]
];

const partners = [
  ["Restaurant Partner", "/restaurant-dashboard"],
  ["Delivery Partner", "/delivery-dashboard"],
  ["Admin Portal", "/admin-dashboard"],
  ["Join FoodGo", "/register"]
];

export default function Footer() {
  return (
    <>
      <style>{`
        .fg-footer{
          background:#101827;color:#fff;padding:50px 0 0;
          margin-top:60px;overflow:hidden;
        }

        .fg-footer *{box-sizing:border-box}

        .fg-footer-wrap{
          width:min(1150px,calc(100% - 32px));
          margin:auto;
        }

        .fg-footer-top{
          display:flex;align-items:center;justify-content:space-between;
          gap:25px;padding:22px 25px;margin-bottom:45px;
          border:1px solid rgba(255,255,255,.1);
          border-radius:18px;
          background:linear-gradient(100deg,#ff5a1f,#ff7138);
        }

        .fg-footer-top h3{
          margin:0 0 5px;font-size:22px;
        }

        .fg-footer-top p{
          margin:0;color:#ffe8df;font-size:13px;
        }

        .fg-footer-top a{
          display:flex;align-items:center;gap:8px;
          padding:11px 18px;border-radius:10px;
          background:#fff;color:#ed501b;
          font-size:12px;font-weight:800;
          text-decoration:none;white-space:nowrap;
        }

        .fg-footer-main{
          display:grid;
          grid-template-columns:1.5fr .8fr .9fr 1.2fr;
          gap:45px;padding-bottom:45px;
        }

        .fg-brand{
          display:flex;align-items:center;gap:11px;
          color:#fff;text-decoration:none;
        }

        .fg-logo{
          width:45px;height:45px;
          display:grid;place-items:center;
          border-radius:13px;
          background:#ff5a1f;
          font-size:24px;font-weight:900;
        }

        .fg-brand strong{
          display:block;font-size:24px;line-height:1;
        }

        .fg-brand strong span{color:#ff6b35}

        .fg-brand small{
          color:#8f9bad;font-size:8px;
          letter-spacing:1.2px;text-transform:uppercase;
        }

        .fg-description{
          max-width:300px;margin:17px 0;
          color:#9da8b8;font-size:12px;line-height:1.7;
        }

        .fg-contact{
          display:flex;flex-direction:column;gap:9px;
        }

        .fg-contact a,.fg-contact span{
          display:flex;align-items:center;gap:9px;
          color:#aeb8c7;font-size:11px;
          text-decoration:none;
        }

        .fg-contact svg{color:#ff6b35}

        .fg-social{
          display:flex;gap:8px;margin-top:17px;
        }

        .fg-social a{
          width:33px;height:33px;
          display:grid;place-items:center;
          border:1px solid rgba(255,255,255,.1);
          border-radius:9px;
          color:#bfc8d4;
          text-decoration:none;
          transition:.2s;
        }

        .fg-social a:hover{
          background:#ff5a1f;color:#fff;
          border-color:#ff5a1f;
          transform:translateY(-3px);
        }

        .fg-column h4{
          margin:4px 0 16px;font-size:14px;
        }

        .fg-column h4:after{
          content:"";display:block;
          width:25px;height:2px;
          margin-top:8px;border-radius:5px;
          background:#ff5a1f;
        }

        .fg-column a{
          display:flex;align-items:center;
          justify-content:space-between;
          width:170px;padding:6px 0;
          color:#9da8b8;font-size:11px;
          text-decoration:none;transition:.2s;
        }

        .fg-column a:hover{
          color:#fff;transform:translateX(3px);
        }

        .fg-column a svg{
          color:#ff6b35;font-size:7px;
        }

        .fg-app{
          padding:16px;
          border:1px solid rgba(255,255,255,.09);
          border-radius:16px;
          background:rgba(255,255,255,.035);
        }

        .fg-app h4{
          margin:0;font-size:14px;
        }

        .fg-app>p{
          margin:5px 0 12px;
          color:#8f9bad;font-size:10px;
        }

        .fg-live{
          display:flex;align-items:center;gap:9px;
          padding:10px;border-radius:10px;
          background:#182235;
        }

        .fg-bike{
          width:30px;height:30px;
          display:grid;place-items:center;
          border-radius:8px;
          background:#ff5a1f;
          font-size:11px;
        }

        .fg-live-info{
          flex:1;display:flex;flex-direction:column;
        }

        .fg-live-info small{
          color:#ff9874;font-size:6px;
          font-weight:800;
        }

        .fg-live-info strong{font-size:9px}

        .fg-live-status{
          padding:3px 5px;border-radius:4px;
          background:#24a55a;font-size:5px;
          font-weight:800;
        }

        .fg-rating{
          display:flex;align-items:center;
          gap:4px;margin-top:9px;
          color:#f5b51b;font-size:8px;
        }

        .fg-rating span{color:#9da8b8}

        .fg-stores{
          display:flex;gap:7px;margin-top:11px;
        }

        .fg-store{
          flex:1;display:flex;
          align-items:center;gap:6px;
          padding:7px;border:1px solid rgba(255,255,255,.1);
          border-radius:8px;background:#111a29;
          color:#fff;cursor:pointer;
        }

        .fg-store svg{font-size:15px}

        .fg-store span{
          display:flex;flex-direction:column;
          text-align:left;
        }

        .fg-store small{color:#8792a3;font-size:5px}
        .fg-store b{font-size:8px}

        .fg-bottom{
          display:flex;align-items:center;
          justify-content:space-between;
          gap:15px;padding:18px 0;
          border-top:1px solid rgba(255,255,255,.08);
          color:#7f8a9b;font-size:10px;
        }

        .fg-bottom-links{
          display:flex;gap:14px;
        }

        .fg-bottom a{
          color:#929dad;text-decoration:none;
        }

        .fg-bottom a:hover{color:#ff6b35}

        .fg-made{
          display:flex;align-items:center;gap:5px;
        }

        .fg-made svg{color:#ff5a1f}

        @media(max-width:950px){
          .fg-footer-main{
            grid-template-columns:1.4fr 1fr 1fr;
          }

          .fg-app{grid-column:span 3}
        }

        @media(max-width:650px){
          .fg-footer-top{
            flex-direction:column;
            align-items:flex-start;
          }

          .fg-footer-main{
            grid-template-columns:1fr 1fr;
            gap:35px 20px;
          }

          .fg-brand-section,.fg-app{
            grid-column:span 2;
          }

          .fg-bottom{
            flex-direction:column;
            align-items:flex-start;
          }
        }

        @media(max-width:420px){
          .fg-footer-main{
            grid-template-columns:1fr;
          }

          .fg-brand-section,.fg-app{
            grid-column:auto;
          }

          .fg-stores{
            flex-direction:column;
          }
        }
      `}</style>

      <footer className="fg-footer">

        <div className="fg-footer-wrap">

          {/* CTA */}
          <div className="fg-footer-top">
            <div>
              <h3>Good food is just a click away 🍴</h3>
              <p>Discover restaurants, order your favourites and enjoy fast delivery.</p>
            </div>

            <Link to="/restaurants">
              Explore FoodGo <FaArrowRight />
            </Link>
          </div>

          {/* Main */}
          <div className="fg-footer-main">

            {/* Brand */}
            <div className="fg-brand-section">
              <Link to="/" className="fg-brand">
                <div className="fg-logo">F</div>

                <div>
                  <strong>Food<span>Go</span></strong>
                  <small>smart food delivery</small>
                </div>
              </Link>

              <p className="fg-description">
                Great food, trusted restaurants and reliable delivery —
                all in one simple FoodGo experience.
              </p>

              <div className="fg-contact">
                <a href="mailto:support@foodgo.com">
                  <FaEnvelope /> support@foodgo.com
                </a>

                <a href="tel:+919876543210">
                  <FaPhone /> +91 98765 43210
                </a>

                <span>
                  <FaMapMarkerAlt /> Chennai, Tamil Nadu
                </span>
              </div>

              <div className="fg-social">
                <a href="#instagram" aria-label="Instagram">
                  <FaInstagram />
                </a>
                <a href="#facebook" aria-label="Facebook">
                  <FaFacebookF />
                </a>
                <a href="#twitter" aria-label="Twitter">
                  <FaTwitter />
                </a>
              </div>
            </div>

            {/* Explore */}
            <div className="fg-column">
              <h4>Explore</h4>

              {explore.map(([name, path]) => (
                <Link key={path} to={path}>
                  {name}<FaArrowRight />
                </Link>
              ))}
            </div>

            {/* Partners */}
            <div className="fg-column">
              <h4>Partners</h4>

              {partners.map(([name, path]) => (
                <Link key={path} to={path}>
                  {name}<FaArrowRight />
                </Link>
              ))}
            </div>

            {/* App */}
            <div className="fg-app">
              <h4>FoodGo in your pocket 📱</h4>
              <p>Order faster. Track live. Eat better.</p>

              <div className="fg-live">
                <div className="fg-bike">
                  <FaMotorcycle />
                </div>

                <div className="fg-live-info">
                  <small>LIVE DELIVERY</small>
                  <strong>Arriving in 18 minutes</strong>
                </div>

                <span className="fg-live-status">LIVE</span>
              </div>

              <div className="fg-rating">
                <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
                <span>4.9 • Loved by foodies</span>
              </div>

              <div className="fg-stores">
                <button className="fg-store" type="button">
                  <FaGooglePlay />
                  <span>
                    <small>GET IT ON</small>
                    <b>Google Play</b>
                  </span>
                </button>

                <button className="fg-store" type="button">
                  <FaApple />
                  <span>
                    <small>DOWNLOAD ON THE</small>
                    <b>App Store</b>
                  </span>
                </button>
              </div>
            </div>

          </div>

          {/* Bottom */}
          <div className="fg-bottom">
            <span>© 2026 FoodGo. All rights reserved.</span>

            <div className="fg-bottom-links">
              <Link to="/contact">Privacy</Link>
              <Link to="/contact">Terms</Link>
              <Link to="/contact">Accessibility</Link>
            </div>

            <span className="fg-made">
              Made with <FaHeart /> for food lovers
            </span>
          </div>

        </div>
      </footer>
    </>
  );
}