import { Button, Card } from "@heroui/react";
import { ArrowRight, ExternalLink, GitBranch, Grid3X3, Route, ShieldCheck } from "lucide-react";
import { LearnWalkthrough } from "../components/LearnWalkthrough";

export function LearnPage() {
  return (
    <div className="page learn-page">
      <section className="page-intro learn-intro"><div className="eyebrow">Rules + reasoning</div><h1>One move. Two consequences.</h1><p>Ultimate Tic-Tac-Toe keeps the familiar three-in-a-row goal, then turns every cell into a routing decision.</p><Button variant="primary" onPress={() => document.getElementById("guided-lessons")?.scrollIntoView({ behavior: "smooth" })}>Begin walkthrough <ArrowRight size={16} /></Button></section>

      <section className="rule-steps">
        <RuleCard number="01" icon={<Grid3X3 />} title="Play locally">Place your mark in any open cell of the highlighted local board.</RuleCard>
        <RuleCard number="02" icon={<Route />} title="Route the reply">The cell you choose points to the local board where your opponent must play.</RuleCard>
        <RuleCard number="03" icon={<ShieldCheck />} title="Claim the arena">Win three local boards in a global row, column, or diagonal.</RuleCard>
      </section>

      <LearnWalkthrough />

      <section className="algorithm-section">
        <div><div className="eyebrow"><GitBranch size={14} /> Inside the opponent</div><h2>Minimax reads the futures.</h2><p>The engine expands legal replies to a chosen depth. X maximizes a position score; O minimizes it. Alpha–beta bounds discard branches that cannot change the decision, producing the same move with less work.</p></div>
        <Card className="score-card" variant="default"><Card.Header><Card.Title>Heuristic signals</Card.Title><Card.Description>Non-terminal positions are scored from X’s perspective.</Card.Description></Card.Header><Card.Content><Score label="Local board ownership" value="13 / −12" /><Score label="Global immediate threats" value="13 / −14" /><Score label="Local immediate threats" value="5 / −5" /><Score label="Terminal win or loss" value="±1,000,000" /><Score label="Terminal draw" value="0" /></Card.Content></Card>
      </section>

      <Card className="open-source-card" variant="secondary"><Card.Content><div><span className="eyebrow">Open implementation</span><h2>Inspect every rule and cutoff.</h2><p>The game model, evaluator, worker protocol, test fixtures, and original Python project all live in the repository.</p></div><Button variant="outline" onPress={() => window.open("https://github.com/MohammadaminKafi/ultimate-tic-tac-toe", "_blank")}>View source <ExternalLink size={16} /></Button></Card.Content></Card>
    </div>
  );
}

function RuleCard({ number, icon, title, children }: { number: string; icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return <Card className="rule-card" variant="default"><Card.Header><span>{number}</span>{icon}</Card.Header><Card.Content><h2>{title}</h2><p>{children}</p></Card.Content></Card>;
}

function Score({ label, value }: { label: string; value: string }) {
  return <div className="score-row"><span>{label}</span><strong>{value}</strong></div>;
}
