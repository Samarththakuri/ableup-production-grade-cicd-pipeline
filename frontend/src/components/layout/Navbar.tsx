import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, Accessibility } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navLinks = [
    { label: "About", href: "/#about" },
    { label: "How It Works", href: "/#how-it-works" },
    { label: "For Candidates", href: "/#candidates" },
    { label: "For Recruiters", href: "/#recruiters" },
  ];

  const getDashboardPath = () => {
    if (!user) return "/";
    switch (user.role) {
      case "admin": return "/admin";
      case "recruiter": return "/recruiter";
      default: return "/candidate";
    }
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const [path, hash] = href.split("#");
    if (location.pathname === "/" || location.pathname === path) {
      const el = document.getElementById(hash);
      el?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/");
      setTimeout(() => {
        const el = document.getElementById(hash);
        el?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80" role="banner">
      <nav className="container flex h-16 items-center justify-between" aria-label="Main navigation">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-primary" aria-label="AbelUp Home">
          <Accessibility className="h-7 w-7" aria-hidden="true" />
          <span>AbelUp</span>
        </Link>

        <ul className="hidden items-center gap-6 md:flex" role="menubar">
          {navLinks.map((link) => (
            <li key={link.label} role="none">
              <a href={link.href} onClick={(e) => handleNavClick(e, link.href)} className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary focus-visible:text-primary" role="menuitem">
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <>
              <Button variant="ghost" onClick={() => navigate(getDashboardPath())}>Dashboard</Button>
              {user?.role === "candidate" && (
                <Button variant="ghost" onClick={() => navigate("/candidate/profile")}>Profile</Button>
              )}
              <Button variant="outline" onClick={logout}>Logout</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate("/login")}>Login</Button>
              <Button onClick={() => navigate("/register")}>Register</Button>
            </>
          )}
        </div>

        <button className="md:hidden p-2 rounded-md hover:bg-muted" onClick={() => setMobileOpen(!mobileOpen)} aria-expanded={mobileOpen} aria-label="Toggle navigation menu">
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="border-t bg-background md:hidden" role="menu">
          <ul className="container flex flex-col gap-2 py-4">
            {navLinks.map((link) => (
              <li key={link.label}>
                <a href={link.href} className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-primary" onClick={(e) => { handleNavClick(e, link.href); setMobileOpen(false); }} role="menuitem">
                  {link.label}
                </a>
              </li>
            ))}
            <li className="mt-2 flex flex-col gap-2">
              {isAuthenticated ? (
                <>
                  <Button variant="ghost" onClick={() => { navigate(getDashboardPath()); setMobileOpen(false); }}>Dashboard</Button>
                  {user?.role === "candidate" && (
                    <Button variant="ghost" onClick={() => { navigate("/candidate/profile"); setMobileOpen(false); }}>Profile</Button>
                  )}
                  <Button variant="outline" onClick={() => { logout(); setMobileOpen(false); }}>Logout</Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => { navigate("/login"); setMobileOpen(false); }}>Login</Button>
                  <Button onClick={() => { navigate("/register"); setMobileOpen(false); }}>Register</Button>
                </>
              )}
            </li>
          </ul>
        </div>
      )}
    </header>
  );
};

export default Navbar;
