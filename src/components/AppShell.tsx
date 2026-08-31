import { Button } from "@heroui/react";
import { Github, Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { NavLink } from "react-router-dom";

import { ThemeToggle } from "./ThemeToggle";

const links = [
  ["/", "Play"],
  ["/replays", "Replays"],
  ["/learn", "Learn"],
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="app-shell">
      <header className="site-header">
        <NavLink to="/" className="brand" aria-label="Ultimate Tic-Tac-Toe home">
          <span className="brand-mark" aria-hidden="true"><i /><i /></span>
          <span><strong>Ultimate Tic-Tac-Toe</strong><small>Minimax Arena</small></span>
        </NavLink>
        <nav className={open ? "site-nav is-open" : "site-nav"} aria-label="Main navigation">
          {links.map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={() => setOpen(false)}
              className={({ isActive }) => (isActive ? "nav-link is-active" : "nav-link")}
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="header-actions">
          <Button
            isIconOnly
            variant="ghost"
            aria-label="Open source on GitHub"
            onPress={() => window.open("https://github.com/MohammadaminKafi/ultimate-tic-tac-toe", "_blank")}
          >
            <Github size={18} />
          </Button>
          <ThemeToggle />
          <Button
            isIconOnly
            variant="ghost"
            className="menu-button"
            aria-label={open ? "Close navigation" : "Open navigation"}
            onPress={() => setOpen((value) => !value)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>
      </header>
      <main>{children}</main>
      <footer className="site-footer">
        <span>Built around deterministic minimax + alpha–beta pruning.</span>
        <span>Orange opens. Green answers.</span>
      </footer>
    </div>
  );
}
