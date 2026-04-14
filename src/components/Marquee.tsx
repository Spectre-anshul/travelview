import React from 'react';

interface Testimonial {
  quote: string;
  author: string;
  title: string;
}

const testimonials: Testimonial[] = [
  {
    quote: "The transition from planning to poolside was seamless. Travel View redefined what luxury means.",
    author: "Sophia Laurent",
    title: "Elite Traveler Review",
  },
  {
    quote: "I described my dream trip in a sentence. They built an entire itinerary that felt psychic.",
    author: "James Chen",
    title: "Forbes Travel",
  },
  {
    quote: "Every recommendation was spot-on. It's like having a best friend who's traveled everywhere.",
    author: "Amara Okafor",
    title: "Condé Nast Traveller",
  },
  {
    quote: "From Bali villas to Icelandic hot springs — curated perfection in every detail.",
    author: "Marcus Rivera",
    title: "Robb Report",
  },
  {
    quote: "The AI understood not just what I wanted, but what I didn't know I needed.",
    author: "Elena Petrova",
    title: "Luxury Travel Magazine",
  },
  {
    quote: "Travel View turned a stressful honeymoon plan into a single, magical conversation.",
    author: "David & Sarah Kim",
    title: "Travel + Leisure",
  },
];

const Marquee: React.FC = () => {
  // Duplicate for seamless infinite loop
  const items = [...testimonials, ...testimonials];

  return (
    <div className="marquee-container">
      <div className="marquee-track">
        {items.map((t, i) => (
          <div key={i} className="testimonial-card">
            <blockquote>"{t.quote}"</blockquote>
            <cite>
              {t.author} — {t.title}
            </cite>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Marquee;
