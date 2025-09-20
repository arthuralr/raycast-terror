import { Raycaster } from "@/components/raycaster/raycaster";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, ArrowUp, MoveHorizontal, MoveVertical } from "lucide-react";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background p-4 sm:p-8 font-headline">
      <div className="w-full max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-accent tracking-tighter">WebRay</h1>
          <p className="text-lg text-primary-foreground/80 mt-2">A first-person pseudo-3D adventure.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="flex-grow w-full">
            <Raycaster />
          </div>

          <div className="w-full lg:w-80 flex-shrink-0 space-y-6">
            <Card className="bg-primary/50 border-accent/20">
              <CardHeader>
                <CardTitle className="text-accent flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-gamepad-2"><line x1="6" x2="10" y1="12" y2="12"/><line x1="8" x2="8" y1="10" y2="14"/><path d="M13 4v4"/><path d="M17 4v4"/><path d="M14 13.044V17.8a2.5 2.5 0 0 1-2.67 2.2c-1.48-.06-2.67-1.34-2.67-2.82V13.044A2.73 2.73 0 0 1 11 10.5h2a2.73 2.73 0 0 1 2.73 2.544Z"/><path d="M4 12c0-4.42 3.58-8 8-8s8 3.58 8 8-3.58 8-8 8-8-3.58-8-8Z"/></svg>
                  Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-primary-foreground">
                <div className="flex items-center justify-between">
                  <p>Move Forward / Backward</p>
                  <div className="flex items-center gap-2 p-1 bg-background/50 rounded-md">
                    <kbd className="px-2 py-1 text-xs font-sans font-semibold text-accent bg-background rounded">W</kbd>
                    <kbd className="px-2 py-1 text-xs font-sans font-semibold text-accent bg-background rounded">S</kbd>
                  </div>
                </div>
                 <div className="flex items-center justify-between">
                  <p>Turn Left / Right</p>
                  <div className="flex items-center gap-2 p-1 bg-background/50 rounded-md">
                    <kbd className="px-2 py-1 text-xs font-sans font-semibold text-accent bg-background rounded">A</kbd>
                    <kbd className="px-2 py-1 text-xs font-sans font-semibold text-accent bg-background rounded">D</kbd>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-primary/50 border-accent/20">
              <CardHeader>
                <CardTitle className="text-accent flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-map"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" x2="9" y1="3" y2="18"/><line x1="15" x2="15" y1="6" y2="21"/></svg>
                  Objective
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-primary-foreground">Explore the environment. There are no enemies, just vibes. See what you can find!</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
