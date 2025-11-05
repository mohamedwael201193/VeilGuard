import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { waves } from "@/data/roadmap";
import type { Wave, WaveStatus } from "@/types/roadmap";
import {
  CheckCircle,
  Link as LinkIcon,
  Shield,
  TrendingUp,
} from "lucide-react";
import React from "react";

export default function Roadmap() {
  const [statusFilter, setStatusFilter] = React.useState<
    "All" | WaveStatus | "All"
  >("All");

  const filteredWaves = waves.filter((wave) => {
    if (statusFilter === "All") return true;
    return wave.status === statusFilter;
  });

  const scrollToWave = (waveId: string) => {
    const element = document.getElementById(waveId);
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const copyLinkToWave = (waveId: string) => {
    const url = `${window.location.origin}${window.location.pathname}#${waveId}`;
    navigator.clipboard.writeText(url);
  };

  const getStatusColor = (status: WaveStatus) => {
    switch (status) {
      case "Done":
        return "bg-green-500/10 text-green-400 border-green-500/30";
      case "In Progress":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "Planned":
        return "bg-slate-500/10 text-slate-400 border-slate-500/30";
    }
  };

  const getProgressPercent = (wave: Wave) => {
    const done = wave.deliverables.filter((d) => d.done).length;
    return Math.round((done / wave.deliverables.length) * 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
      <Header />
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-6">
              VeilGuard Roadmap
            </h1>
            <p className="text-xl text-slate-300 mb-8">
              Building privacy-preserving payments for the real world
            </p>

            {/* Status Filter */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
              <span className="text-sm text-slate-400">Filter by status:</span>
              {["All", "Done", "In Progress", "Planned"].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status as typeof statusFilter)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === status
                      ? "bg-purple-600 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-400"></div>
                <span>Done</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-amber-400"></div>
                <span>In Progress</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-slate-400"></div>
                <span>Planned</span>
              </div>
            </div>
          </div>

          {/* Sticky Timeline Navigation */}
          <div className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-sm border-y border-purple-500/20 py-3 mb-8">
            <div className="flex items-center justify-center gap-2 overflow-x-auto">
              {waves.map((wave) => (
                <button
                  key={wave.id}
                  onClick={() => scrollToWave(wave.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 whitespace-nowrap transition-colors"
                >
                  Wave {wave.number}
                </button>
              ))}
            </div>
          </div>

          {/* Wave Cards */}
          <div className="space-y-8">
            {filteredWaves.map((wave) => {
              const progressPercent = getProgressPercent(wave);
              return (
                <Card
                  key={wave.id}
                  id={wave.id}
                  className="bg-slate-800/50 backdrop-blur-sm border-purple-500/20"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
                          {wave.number}
                        </div>
                        <div>
                          <CardTitle className="text-white text-lg">
                            Wave {wave.number}: {wave.title}
                          </CardTitle>
                          <p className="text-sm text-slate-400 mt-1">
                            {wave.dateRange}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => copyLinkToWave(wave.id)}
                        className="text-slate-400 hover:text-slate-300 transition-colors"
                        title="Copy link to this wave"
                      >
                        <LinkIcon className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3 mt-3">
                      <Badge
                        className={`${getStatusColor(wave.status)} border`}
                      >
                        {wave.status}
                      </Badge>
                      {wave.deliverables.length > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <Progress
                            value={progressPercent}
                            className="w-24 h-2"
                          />
                          <span className="text-slate-400 text-xs">
                            {progressPercent}% (
                            {wave.deliverables.filter((d) => d.done).length}/
                            {wave.deliverables.length})
                          </span>
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent>
                    <Accordion type="multiple" className="w-full">
                      {/* Objectives */}
                      {wave.objectives.length > 0 && (
                        <AccordionItem value="objectives">
                          <AccordionTrigger className="text-white">
                            Objectives
                          </AccordionTrigger>
                          <AccordionContent>
                            <ul className="space-y-2">
                              {wave.objectives.map((obj, idx) => (
                                <li
                                  key={idx}
                                  className="flex items-start gap-2 text-slate-300"
                                >
                                  <span className="text-purple-400 mt-1">
                                    •
                                  </span>
                                  <span>{obj}</span>
                                </li>
                              ))}
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                      )}

                      {/* Deliverables */}
                      {wave.deliverables.length > 0 && (
                        <AccordionItem value="deliverables">
                          <AccordionTrigger className="text-white">
                            Deliverables
                          </AccordionTrigger>
                          <AccordionContent>
                            <ul className="space-y-2">
                              {wave.deliverables.map((del, idx) => (
                                <li
                                  key={idx}
                                  className="flex items-start gap-3"
                                >
                                  {del.done ? (
                                    <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                                  ) : (
                                    <div className="h-5 w-5 rounded-full border-2 border-slate-500 mt-0.5 flex-shrink-0" />
                                  )}
                                  <span className="text-slate-300">
                                    {del.label}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                      )}

                      {/* Acceptance Criteria */}
                      {wave.acceptanceCriteria.length > 0 && (
                        <AccordionItem value="acceptance">
                          <AccordionTrigger className="text-white">
                            Acceptance Criteria
                          </AccordionTrigger>
                          <AccordionContent>
                            <ul className="space-y-2">
                              {wave.acceptanceCriteria.map((ac, idx) => (
                                <li
                                  key={idx}
                                  className="flex items-start gap-2 text-slate-300"
                                >
                                  <Shield className="h-4 w-4 text-purple-400 mt-1 flex-shrink-0" />
                                  <span>{ac}</span>
                                </li>
                              ))}
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                      )}

                      {/* Dependencies */}
                      {wave.dependencies && wave.dependencies.length > 0 && (
                        <AccordionItem value="dependencies">
                          <AccordionTrigger className="text-white">
                            Dependencies
                          </AccordionTrigger>
                          <AccordionContent>
                            <ul className="space-y-2">
                              {wave.dependencies.map((dep, idx) => (
                                <li
                                  key={idx}
                                  className="flex items-start gap-2 text-slate-300"
                                >
                                  <span className="text-slate-500 mt-1">→</span>
                                  <span>{dep}</span>
                                </li>
                              ))}
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                      )}

                      {/* Risks */}
                      {wave.risks && wave.risks.length > 0 && (
                        <AccordionItem value="risks">
                          <AccordionTrigger className="text-white">
                            Risks
                          </AccordionTrigger>
                          <AccordionContent>
                            <ul className="space-y-2">
                              {wave.risks.map((risk, idx) => (
                                <li
                                  key={idx}
                                  className="flex items-start gap-2 text-slate-300"
                                >
                                  <span className="text-amber-400 mt-1">⚠</span>
                                  <span>{risk}</span>
                                </li>
                              ))}
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                      )}

                      {/* Demo Plan */}
                      {wave.demoPlan && wave.demoPlan.length > 0 && (
                        <AccordionItem value="demo">
                          <AccordionTrigger className="text-white">
                            Demo Plan
                          </AccordionTrigger>
                          <AccordionContent>
                            <ul className="space-y-2">
                              {wave.demoPlan.map((step, idx) => (
                                <li
                                  key={idx}
                                  className="flex items-start gap-2 text-slate-300"
                                >
                                  <span className="text-blue-400 mt-1">
                                    {idx + 1}.
                                  </span>
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                      )}

                      {/* KPIs */}
                      {wave.kpis && wave.kpis.length > 0 && (
                        <AccordionItem value="kpis">
                          <AccordionTrigger className="text-white">
                            KPIs
                          </AccordionTrigger>
                          <AccordionContent>
                            <ul className="space-y-2">
                              {wave.kpis.map((kpi, idx) => (
                                <li
                                  key={idx}
                                  className="flex items-start gap-2 text-slate-300"
                                >
                                  <TrendingUp className="h-4 w-4 text-green-400 mt-1 flex-shrink-0" />
                                  <span>{kpi}</span>
                                </li>
                              ))}
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                      )}

                      {/* Notes */}
                      {wave.notes && wave.notes.length > 0 && (
                        <AccordionItem value="notes">
                          <AccordionTrigger className="text-white">
                            Notes
                          </AccordionTrigger>
                          <AccordionContent>
                            <ul className="space-y-2">
                              {wave.notes.map((note, idx) => (
                                <li
                                  key={idx}
                                  className="flex items-start gap-2 text-slate-300"
                                >
                                  <span className="text-slate-500 mt-1">ℹ</span>
                                  <span>{note}</span>
                                </li>
                              ))}
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                      )}
                    </Accordion>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredWaves.length === 0 && (
            <div className="text-center py-16">
              <p className="text-slate-400">
                No waves match the selected filter.
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
