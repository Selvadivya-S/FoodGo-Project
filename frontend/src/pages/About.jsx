import React from "react";

import {
  FaBolt,
  FaHeart,
  FaMotorcycle,
  FaShieldAlt,
  FaStar,
} from "react-icons/fa";


// ==================================================
// ABOUT PAGE
// ==================================================

export default function About() {
  return (
    <section className="fg-page">

      <div className="fg-shell">

        {/* ========================================== */}
        {/* About Hero */}
        {/* ========================================== */}

        <div className="fg-about-hero">

          <div>

            <span className="fg-section-kicker">
              ABOUT FOODGO
            </span>

            <h1>
              We make everyday food feel
              extraordinary.
            </h1>

            <p>
              FoodGo connects hungry people
              with great local restaurants
              through a faster, smarter and
              more human delivery experience.
            </p>

          </div>


          <img
            src="https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=85"
            alt="Fresh food"
          />

        </div>


        {/* ========================================== */}
        {/* FoodGo Values */}
        {/* ========================================== */}

        <div className="fg-value-grid">

          {[
            [
              FaBolt,
              "Fast by design",
              "Reliable ETAs and smart delivery routing.",
            ],
            [
              FaHeart,
              "Made for foodies",
              "Menus, offers and recommendations that feel personal.",
            ],
            [
              FaShieldAlt,
              "Safe & simple",
              "Secure checkout and transparent order updates.",
            ],
            [
              FaMotorcycle,
              "Local first",
              "We help neighbourhood restaurants reach more customers.",
            ],
          ].map(([Icon, title, description]) => (

            <article key={title}>

              <Icon />

              <h3>
                {title}
              </h3>

              <p>
                {description}
              </p>

            </article>

          ))}

        </div>


        {/* ========================================== */}
        {/* FoodGo Statistics */}
        {/* ========================================== */}

        <div className="fg-about-stats">

          <div>
            <b>8,500+</b>
            <span>
              restaurant partners
            </span>
          </div>

          <div>
            <b>1.2M+</b>
            <span>
              orders delivered
            </span>
          </div>

          <div>
            <b>4.7/5</b>
            <span>
              customer rating
            </span>
          </div>

          <div>
            <b>30 min</b>
            <span>
              average delivery
            </span>
          </div>

        </div>


        {/* ========================================== */}
        {/* FoodGo Promise */}
        {/* ========================================== */}

        <div className="fg-story">

          <span className="fg-section-kicker">
            OUR PROMISE
          </span>

          <h2>
            Less waiting. More enjoying.
          </h2>

          <p>
            From the moment you search to the
            moment the bag reaches your door,
            every part of FoodGo is designed
            around clarity, speed and delight.
          </p>

          <span>
            <FaStar />
            {" "}
            Loved by foodies across India
          </span>

        </div>

      </div>

    </section>
  );
}