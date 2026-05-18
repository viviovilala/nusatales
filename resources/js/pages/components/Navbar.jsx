import { NavLink } from "react-router-dom";
import { useState, useEffect, useRef } from "react";

const navItems = ["Beranda", "Shorts", "Jelajah", "Peta", "Favorit"];

export default function Navbar() {
  const [visible, setVisible] = useState(true);
  const lastY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY < 10) {
        setVisible(true);
      } else if (currentY > lastY.current) {
        setVisible(false);
      } else {
        setVisible(true);
      }
      lastY.current = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className="px-4 sticky top-2 z-50 transition-all duration-300"
      style={{
        transform: visible ? "translateY(0)" : "translateY(-120%)",
        opacity: visible ? 1 : 0,
        paddingTop: "6px",
        paddingBottom: "4px",
      }}
    >
      <nav className="max-w-5xl mx-auto bg-white rounded-full px-6 py-2.5 grid grid-cols-[1fr_auto_1fr] items-center shadow-sm">

        {/* Logo */}
        <div className="flex items-center gap-2">
          <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
            <polygon points="14,2 26,14 14,26 2,14" fill="#C8960C" />
            <polygon points="14,6 22,14 14,22 6,14" fill="#F5C842" />
          </svg>
          <span
            className="font-bold text-lg"
            style={{ color: "#3B2A0E", fontFamily: "Georgia, serif" }}
          >
            NusaTales
          </span>
        </div>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <NavLink
              key={item}
              to={item === "Beranda" ? "/" : `/${item.toLowerCase()}`}
              className="flex flex-col items-center gap-0.5 text-sm font-medium transition-opacity hover:opacity-75"
              style={({ isActive }) => ({
                color: isActive ? "#3B2A0E" : "#6B5A3E",
                fontFamily: "Georgia, serif",
                opacity: isActive ? 1 : 0.5,
              })}
            >
              {({ isActive }) => (
                <>
                  <span
                    style={{
                      display: "inline-block",
                      transition: "transform 0.2s ease",
                      transform: isActive ? "translateY(-1px)" : "translateY(0)",
                    }}
                  >
                    {item}
                  </span>
                  <span
                    style={{
                      height: "2px",
                      width: "100%",
                      borderRadius: "999px",
                      backgroundColor: "#C8960C",
                      opacity: isActive ? 1 : 0,
                      transition: "opacity 0.2s ease",
                      display: "block",
                    }}
                  />
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2 justify-end">
          <button
            className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm border transition hover:bg-amber-50"
            style={{
              borderColor: "#D1C9B0",
              color: "#6B5A3E",
              fontFamily: "Georgia, serif",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            Cari...
          </button>
          <NavLink
            to="/login"
            className="px-4 py-1.5 rounded-full text-sm font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: "#3B2A0E", fontFamily: "Georgia, serif" }}
          >
            Masuk
          </NavLink>
        </div>

      </nav>
    </div>
  );
}
