import { useState } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Check, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface RepertoireRow {
  id: string;
  composer: string;
  piece: string;
  movement: string;
  status: string;
  dateStarted: string;
}

export default function ProfileSetup() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const [repertoire, setRepertoire] = useState<RepertoireRow[]>([
    { id: "1", composer: "", piece: "", movement: "", status: "In Progress", dateStarted: "" }
  ]);

  const addRow = () => {
    setRepertoire([...repertoire, { id: Math.random().toString(36).substr(2, 9), composer: "", piece: "", movement: "", status: "In Progress", dateStarted: "" }]);
  };

  const removeRow = (id: string) => {
    if (repertoire.length > 1) {
      setRepertoire(repertoire.filter(row => row.id !== id));
    }
  };

  const updateRow = (id: string, field: keyof RepertoireRow, value: string) => {
    setRepertoire(repertoire.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      setLocation("/profile");
    }
  };

  return (
    <Layout>
      <div className="min-h-[80vh] py-16 px-4 bg-secondary/30 flex items-center justify-center">
        <div className={cn("w-full transition-all duration-500", step === 3 ? "max-w-6xl" : "max-w-2xl")}>
          <div className="mb-8 flex items-center justify-center gap-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-serif font-bold border-2 transition-all",
                  step >= s 
                    ? "bg-primary border-primary text-white" 
                    : "bg-transparent border-muted-foreground/30 text-muted-foreground"
                )}>
                  {step > s ? <Check className="w-5 h-5" /> : s}
                </div>
                {s < totalSteps && (
                  <div className={cn(
                    "w-16 h-0.5 mx-2",
                    step > s ? "bg-primary" : "bg-muted-foreground/30"
                  )} />
                )}
              </div>
            ))}
          </div>

          <Card className="border-none shadow-xl">
            <CardHeader className="text-center pb-8 pt-8">
              <CardTitle className="font-serif text-3xl">
                {step === 1 ? "Basic Info" : step === 2 ? "Artist Profile" : "Build Your Repertoire"}
              </CardTitle>
              <CardDescription className="text-lg">
                {step === 1 ? "Start with the essentials." : step === 2 ? "Tell the community about yourself." : "Add the pieces you're working on or have learned."}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8 space-y-6">
              {step === 1 && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="display-name">Display Name</Label>
                    <Input id="display-name" placeholder="e.g. Elena Corvin" className="h-12 bg-background" />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="instrument">Primary Instrument</Label>
                    <Select>
                      <SelectTrigger className="h-12 bg-background">
                        <SelectValue placeholder="Select instrument" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="piano">Piano</SelectItem>
                        <SelectItem value="violin">Violin</SelectItem>
                        <SelectItem value="cello">Cello</SelectItem>
                        <SelectItem value="flute">Flute</SelectItem>
                        <SelectItem value="voice-soprano">Voice (Soprano)</SelectItem>
                        <SelectItem value="voice-tenor">Voice (Tenor)</SelectItem>
                        <SelectItem value="conductor">Conductor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="level">Experience Level</Label>
                    <Select>
                      <SelectTrigger className="h-12 bg-background">
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="conservatory">Conservatory Student</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="amateur">Serious Amateur</SelectItem>
                        <SelectItem value="educator">Educator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea 
                      id="bio" 
                      placeholder="Share your musical background, education, and current focus..." 
                      className="min-h-[150px] bg-background resize-none leading-relaxed"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="location">Based In</Label>
                    <Input id="location" placeholder="e.g. New York, NY" className="h-12 bg-background" />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Composer</TableHead>
                        <TableHead className="w-[200px]">Piece</TableHead>
                        <TableHead className="w-[150px]">Movement</TableHead>
                        <TableHead className="w-[180px]">Status</TableHead>
                        <TableHead className="w-[150px]">Date Started</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {repertoire.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>
                            <Input 
                              placeholder="e.g. Brahms" 
                              value={row.composer}
                              onChange={(e) => updateRow(row.id, "composer", e.target.value)}
                              className="h-10 bg-background"
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              placeholder="e.g. Sonata No. 3" 
                              value={row.piece}
                              onChange={(e) => updateRow(row.id, "piece", e.target.value)}
                              className="h-10 bg-background"
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              placeholder="e.g. I. Allegro" 
                              value={row.movement}
                              onChange={(e) => updateRow(row.id, "movement", e.target.value)}
                              className="h-10 bg-background"
                            />
                          </TableCell>
                          <TableCell>
                            <Select 
                              value={row.status} 
                              onValueChange={(val) => updateRow(row.id, "status", val)}
                            >
                              <SelectTrigger className="h-10 bg-background">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Wishlist">Wishlist</SelectItem>
                                <SelectItem value="In Progress">In Progress</SelectItem>
                                <SelectItem value="Learned">Learned</SelectItem>
                                <SelectItem value="Performance-ready">Performance-ready</SelectItem>
                                <SelectItem value="Re-learning">Re-learning</SelectItem>
                                <SelectItem value="Stopped learning">Stopped learning</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input 
                              type="date" 
                              disabled={row.status === "Wishlist"}
                              value={row.dateStarted}
                              onChange={(e) => updateRow(row.id, "dateStarted", e.target.value)}
                              className="h-10 bg-background disabled:opacity-30"
                            />
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => removeRow(row.id)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Button variant="outline" onClick={addRow} className="w-full border-dashed">
                    <Plus className="w-4 h-4 mr-2" /> Add Piece
                  </Button>
                </div>
              )}

              <div className="pt-6 flex justify-between">
                <Button 
                  variant="ghost" 
                  onClick={() => setStep(step - 1)} 
                  disabled={step === 1}
                >
                  Back
                </Button>
                <Button onClick={handleNext} size="lg" className="min-w-[140px]">
                  {step === totalSteps ? "Complete Setup" : "Next"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}