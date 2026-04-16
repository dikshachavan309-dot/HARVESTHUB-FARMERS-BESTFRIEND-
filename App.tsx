import { useState, type ReactNode, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Loader2, Info, Sprout, Leaf, Droplets, Shovel, 
  ThermometerSun, LandPlot, Sparkles, ChevronRight, 
  TrendingUp, ShieldAlert, Zap, CloudRain, Wind, 
  MessageSquare, Send, User, Bot, X, DollarSign, Calendar, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getHarvestTips, streamChat, type FarmingTips } from "@/src/services/gemini";
import { CROP_TYPES, LAND_TYPES, SOIL_TYPES, SEASONS } from "@/src/constants";

interface Message {
  role: "user" | "bot";
  content: string;
}

export default function App() {
  const [crop, setCrop] = useState<string>("");
  const [land, setLand] = useState<string>("");
  const [soil, setSoil] = useState<string>("");
  const [season, setSeason] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [tips, setTips] = useState<FarmingTips | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Live Weather Simulation
  const [weather, setWeather] = useState({ temp: 24, condition: "Sunny", humidity: 60 });

  useEffect(() => {
    const updateWeather = () => {
      let tempRange = [20, 30];
      let humidityRange = [40, 60];
      let conditions = ["Sunny", "Cloudy"];

      // Seasonal weather for India
      if (season === "Summer") {
        tempRange = [32, 45];
        humidityRange = [20, 40];
        conditions = ["Hot", "Sunny", "Dusty", "Clear"];
      } else if (season === "Monsoon") {
        tempRange = [25, 32];
        humidityRange = [70, 95];
        conditions = ["Heavy Rain", "Light Rain", "Cloudy", "Thunderstorm"];
      } else if (season === "Winter") {
        tempRange = [10, 22];
        humidityRange = [30, 50];
        conditions = ["Cool", "Sunny", "Foggy", "Clear"];
      } else if (season === "Spring" || season === "Autumn") {
        tempRange = [22, 30];
        humidityRange = [40, 60];
        conditions = ["Pleasant", "Sunny", "Breezy"];
      }

      setWeather({
        temp: Math.floor(Math.random() * (tempRange[1] - tempRange[0]) + tempRange[0]),
        condition: conditions[Math.floor(Math.random() * conditions.length)],
        humidity: Math.floor(Math.random() * (humidityRange[1] - humidityRange[0]) + humidityRange[0])
      });
    };

    updateWeather();
    const interval = setInterval(updateWeather, 10000);
    return () => clearInterval(interval);
  }, [season]);

  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Message[]>([
    { role: "bot", content: "Hello! I'm your farming friend. How can I help you today?" }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  const handleGetTips = async () => {
    if (!crop || !land || !soil || !season) {
      setError("Please pick all the options first.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getHarvestTips(crop, land, soil, season);
      setTips(data);
    } catch (err) {
      setError("Something went wrong. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isChatLoading) return;

    const userMsg = inputMessage;
    setInputMessage("");
    setChatMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setIsChatLoading(true);

    try {
      const history = chatMessages.map(m => ({
        role: m.role === "user" ? "user" as const : "model" as const,
        parts: [{ text: m.content }]
      }));

      const response = await streamChat(userMsg, history);
      setChatMessages(prev => [...prev, { role: "bot", content: response }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: "bot", content: "Sorry, I can't talk right now. Try again soon!" }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#050805]">
      {/* Background Image with Overlay */}
      <div className="fixed inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2000&auto=format&fit=crop"
          alt="Lush Farm"
          className="w-full h-full object-cover opacity-20 scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-12 md:px-12 md:py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass mb-8">
            <Sprout className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-primary/70">Farmer's Best Friend</span>
          </div>
          <h1 className="text-7xl md:text-9xl font-heading italic text-foreground mb-6">
            Harvest<span className="text-primary not-italic">Hub</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto font-light leading-relaxed">
            Easy farming tips for everyone. Get the best advice for your land.
          </p>
        </motion.div>
      </header>

      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-6 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Configuration Panel */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-4 space-y-8"
          >
            {/* Weather Widget */}
            <div className="glass p-8 rounded-[2.5rem] flex items-center justify-between group hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  {weather.condition === "Sunny" || weather.condition === "Hot" ? <ThermometerSun className="w-7 h-7 text-primary" /> : <CloudRain className="w-7 h-7 text-primary" />}
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">Live Weather</p>
                  <p className="text-2xl font-heading text-foreground">{weather.temp}°C • {weather.condition}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-primary tracking-widest">Air Wetness</p>
                <p className="text-lg font-medium">{weather.humidity}%</p>
              </div>
            </div>

            <div className="glass p-10 rounded-[2.5rem] space-y-10">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <Sprout className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-3xl font-heading">Your Farm</h2>
              </div>

              <div className="space-y-8">
                <FarmSelector label="What are you growing?" value={crop} options={CROP_TYPES} onChange={setCrop} icon={<Leaf className="w-5 h-5" />} />
                <FarmSelector label="How is your land?" value={land} options={LAND_TYPES} onChange={setLand} icon={<LandPlot className="w-5 h-5" />} iconColor="text-primary" />
                <FarmSelector label="What is your soil type?" value={soil} options={SOIL_TYPES} onChange={setSoil} icon={<Shovel className="w-5 h-5" />} />
                <FarmSelector label="What is the season?" value={season} options={SEASONS} onChange={setSeason} icon={<ThermometerSun className="w-5 h-5" />} />
              </div>

              {error && (
                <div className="p-5 rounded-2xl bg-destructive/10 text-destructive text-sm flex items-center gap-3 border border-destructive/20">
                  <Info className="w-5 h-5 shrink-0" />
                  {error}
                </div>
              )}

              <Button
                onClick={handleGetTips}
                disabled={loading}
                className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground text-xl font-medium transition-all group shadow-xl shadow-primary/20"
              >
                {loading ? (
                  <Loader2 className="h-7 w-7 animate-spin" />
                ) : (
                  <span className="flex items-center gap-3">
                    Get My Tips <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </Button>
            </div>

            {/* Market Quick View */}
            <div className="glass p-8 rounded-[2.5rem] space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Market News</h3>
                <TrendingUp className="w-5 h-5 text-secondary" />
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Demand</span>
                  <Badge variant="outline" className="text-[10px] border-primary/30 text-primary font-bold">GOOD</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Price Trend</span>
                  <span className="text-sm font-bold text-secondary">Going Up</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Results Area */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {tips ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="space-y-10"
                >
                  {/* Sustainability & Profit Dashboard */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="glass p-8 rounded-[2.5rem] flex flex-col items-center justify-center text-center group hover:bg-white/5 transition-colors">
                      <div className="relative w-28 h-28 flex items-center justify-center mb-5">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-white/5" />
                          <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="10" fill="transparent" strokeDasharray={301.6} strokeDashoffset={301.6 - (301.6 * tips.sustainabilityScore) / 100} className="text-primary transition-all duration-1000" />
                        </svg>
                        <span className="absolute text-3xl font-heading">{tips.sustainabilityScore}%</span>
                      </div>
                      <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">Eco-Friendly Score</p>
                    </div>

                    <div className="glass p-8 rounded-[2.5rem] md:col-span-2 grid grid-cols-3 gap-6 items-center">
                      <ResourceItem icon={<DollarSign className="w-6 h-6" />} label="Est. Cost" value={tips.profitEstimator.estimatedCost} />
                      <ResourceItem icon={<TrendingUp className="w-6 h-6" />} label="Potential Revenue" value={tips.profitEstimator.potentialRevenue} />
                      <ResourceItem icon={<Zap className="w-6 h-6" />} label="Profit Margin" value={tips.profitEstimator.profitMargin} />
                    </div>
                  </div>

                  {/* Soil Health & Fertility Section */}
                  <div className="glass p-10 rounded-[2.5rem] border-primary/20 bg-primary/5">
                    <div className="flex items-center gap-5 mb-8">
                      <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                        <Shovel className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-heading">Soil Fertility Tips</h3>
                        <p className="text-sm text-muted-foreground">Keep your earth healthy and strong</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {tips.soilFertilityTips.map((tip, i) => (
                        <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                          <div className="mt-1 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                            <div className="w-2 h-2 rounded-full bg-primary" />
                          </div>
                          <p className="text-sm leading-relaxed text-muted-foreground">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Crop Calendar Section */}
                  <div className="glass p-10 rounded-[2.5rem]">
                    <div className="flex items-center gap-5 mb-10">
                      <div className="w-14 h-14 rounded-2xl bg-secondary/20 flex items-center justify-center text-secondary">
                        <Calendar className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-heading">Crop Calendar</h3>
                        <p className="text-sm text-muted-foreground">Your month-by-month growing plan</p>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-white/5 md:hidden" />
                      <div className="space-y-12">
                        {tips.cropTimeline.map((item, i) => (
                          <div key={i} className="relative flex flex-col md:flex-row gap-6 md:gap-12 items-start md:items-center">
                            <div className="flex items-center gap-6 md:w-48 shrink-0">
                              <div className="w-16 h-16 rounded-2xl bg-background border-2 border-primary flex items-center justify-center z-10 shadow-lg shadow-primary/10">
                                <span className="text-primary font-heading text-xl">{i + 1}</span>
                              </div>
                              <div className="md:hidden">
                                <h4 className="text-xl font-heading text-primary">{item.stage}</h4>
                                <p className="text-xs uppercase tracking-widest text-muted-foreground">{item.duration}</p>
                              </div>
                            </div>
                            
                            <div className="hidden md:block w-48 shrink-0">
                              <h4 className="text-xl font-heading text-primary">{item.stage}</h4>
                              <p className="text-xs uppercase tracking-widest text-muted-foreground">{item.duration}</p>
                            </div>

                            <div className="flex-1 p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-primary/20 transition-all">
                              <div className="flex items-start gap-4">
                                <div className="mt-1 p-2 rounded-lg bg-primary/10">
                                  <Clock className="w-4 h-4 text-primary" />
                                </div>
                                <p className="text-base text-muted-foreground leading-relaxed">
                                  <span className="font-bold text-foreground block mb-1">Main Task:</span>
                                  {item.task}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <InsightCard 
                      title="How to Plant" 
                      items={tips.plantingTips} 
                      icon={<Sprout className="w-7 h-7" />} 
                      accent="primary"
                    />
                    <InsightCard 
                      title="Market Advice" 
                      items={tips.marketInsights} 
                      icon={<TrendingUp className="w-7 h-7" />} 
                      accent="secondary"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <InsightCard 
                      title="Daily Care" 
                      items={tips.farmingTips} 
                      icon={<Droplets className="w-7 h-7" />} 
                      accent="primary"
                    />
                    <InsightCard 
                      title="Risk Warnings" 
                      items={tips.riskAssessment} 
                      icon={<ShieldAlert className="w-7 h-7" />} 
                      accent="destructive"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <InsightCard 
                      title="Soil Health" 
                      items={tips.soilFertilityTips} 
                      icon={<Shovel className="w-7 h-7" />} 
                      accent="primary"
                    />
                    <div className="glass p-10 rounded-[2.5rem] flex flex-col items-center justify-center text-center space-y-6">
                      <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center">
                        <Droplets className="w-10 h-10 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-xl font-heading mb-2">Water Need</h4>
                        <p className="text-muted-foreground">{tips.resourceEstimates.water}</p>
                      </div>
                      <Separator className="bg-white/5" />
                      <div>
                        <h4 className="text-xl font-heading mb-2">Help Needed</h4>
                        <p className="text-muted-foreground">{tips.resourceEstimates.labor}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full min-h-[600px] flex flex-col items-center justify-center text-center glass rounded-[4rem] p-16"
                >
                  <div className="w-32 h-32 rounded-full bg-primary/5 flex items-center justify-center mb-10 relative">
                    <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
                    <Sprout className="w-16 h-16 text-primary/30" />
                  </div>
                  <h2 className="text-5xl font-heading mb-6">Ready to Start?</h2>
                  <p className="text-xl text-muted-foreground max-w-lg mx-auto font-light leading-relaxed">
                    Pick your crop and land details on the left to get simple farming tips.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* AI Expert Chat Bubble */}
      <div className="fixed bottom-10 right-10 z-50">
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-dark w-[400px] h-[550px] rounded-[2.5rem] mb-6 flex flex-col overflow-hidden shadow-2xl border-white/10"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                    <Bot className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-heading text-xl text-foreground">Farming Friend</h4>
                    <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary">Ready to Help</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsChatOpen(false)} className="rounded-full hover:bg-white/10">
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <ScrollArea className="flex-1 p-8">
                <div className="space-y-6">
                  {chatMessages.map((msg, i) => (
                    <div key={`msg-${i}`}>
                      <ChatMessage role={msg.role} content={msg.content} />
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Bot className="w-5 h-5 text-primary animate-pulse" />
                      </div>
                      <div className="p-4 rounded-2xl bg-white/5 text-muted-foreground text-xs animate-pulse">
                        Thinking...
                      </div>
                    </div>
                  )}
                  <div ref={scrollRef} />
                </div>
              </ScrollArea>

              <div className="p-6 border-t border-white/5 bg-black/20 flex gap-3">
                <input 
                  type="text" 
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Ask me anything about farming..." 
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={isChatLoading || !inputMessage.trim()}
                  size="icon" 
                  className="rounded-2xl bg-primary w-12 h-12 shadow-lg shadow-primary/20"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <Button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="w-20 h-20 rounded-3xl bg-primary shadow-2xl hover:scale-110 active:scale-95 transition-all group"
        >
          <MessageSquare className="w-10 h-10 group-hover:rotate-12 transition-transform" />
        </Button>
      </div>

      <footer className="relative z-10 py-16 text-center border-t border-white/5">
        <p className="text-sm text-muted-foreground font-medium tracking-[0.3em] uppercase">
          © 2024 HarvestHub • Simple Farming Help
        </p>
      </footer>
    </div>
  );
}

function FarmSelector({ label, value, options, onChange, icon, iconColor }: { label: string; value: string; options: string[]; onChange: (v: string) => void; icon: ReactNode; iconColor?: string }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-muted-foreground mb-1">
        <span className={iconColor || "text-muted-foreground/60"}>{icon}</span>
        <label className="text-[10px] uppercase tracking-[0.3em] font-bold">{label}</label>
      </div>
      <Select onValueChange={onChange} value={value}>
        <SelectTrigger className="h-14 rounded-2xl bg-white/5 border-white/10 focus:ring-primary/30 text-foreground font-medium">
          <SelectValue placeholder={`Select ${label}...`} />
        </SelectTrigger>
        <SelectContent className="glass-dark border-white/10 rounded-2xl">
          {options.map((o) => (
            <SelectItem key={o} value={o} className="focus:bg-primary/10 focus:text-foreground py-3">
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function InsightCard({ title, items, icon, accent, fullWidth }: { title: string; items: string[]; icon: ReactNode; accent: "primary" | "secondary" | "destructive"; fullWidth?: boolean }) {
  const accentClass = {
    primary: "bg-primary/20 text-primary",
    secondary: "bg-secondary/20 text-secondary",
    destructive: "bg-destructive/20 text-destructive"
  }[accent];

  const dotClass = {
    primary: "bg-primary/40",
    secondary: "bg-secondary/40",
    destructive: "bg-destructive/40"
  }[accent];

  return (
    <div className={`glass p-10 rounded-[2.5rem] hover:bg-white/5 transition-colors ${fullWidth ? 'md:col-span-2' : ''}`}>
      <div className="flex items-center gap-5 mb-8">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${accentClass}`}>
          {icon}
        </div>
        <h3 className="text-3xl font-heading">{title}</h3>
      </div>
      <ScrollArea className="h-[250px] pr-5">
        <ul className="space-y-5">
          {items.map((item, i) => (
            <li key={i} className="flex gap-4 group">
              <div className={`mt-2.5 w-2 h-2 rounded-full shrink-0 ${dotClass}`} />
              <p className="text-base leading-relaxed text-muted-foreground group-hover:text-foreground transition-colors font-light">
                {item}
              </p>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  );
}

function ResourceItem({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center text-center gap-3 group">
      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-sm">
        {icon}
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-1">{label}</p>
        <p className="text-sm font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}

interface ChatMessageProps {
  role: "bot" | "user";
  content: string;
}

function ChatMessage({ role, content }: ChatMessageProps) {
  return (
    <div className={`flex gap-4 ${role === 'user' ? 'flex-row-reverse' : ''}`}>
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${role === 'bot' ? 'bg-primary/20 text-primary' : 'bg-white/5 text-muted-foreground'}`}>
        {role === 'bot' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
      </div>
      <div className={`p-5 rounded-[1.5rem] text-sm leading-relaxed shadow-sm ${role === 'bot' ? 'bg-white/5 text-muted-foreground border border-white/5' : 'bg-primary text-primary-foreground'}`}>
        {content}
      </div>
    </div>
  );
}
