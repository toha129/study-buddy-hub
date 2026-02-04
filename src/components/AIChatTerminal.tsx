import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, X, Loader2, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { generateDeepSeekResponse, hasDeepSeekKey } from '@/lib/deepseek';
import { useToast } from '@/hooks/use-toast';

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
    attachment?: {
        name: string;
        type: 'image' | 'file';
        content: string; // Base64
    };
}

const AIChatTerminal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: "Gemini Flash Online. Neural Link Active. Ready for queries." }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<{ name: string, type: 'image' | 'file', content: string } | null>(null);
    const [activeModel, setActiveModel] = useState<'deepseek' | 'gemini'>('gemini');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, selectedFile]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const isImage = file.type.startsWith('image/');
                setSelectedFile({
                    name: file.name,
                    type: isImage ? 'image' : 'file',
                    content: reader.result as string
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSend = async () => {
        if ((!input.trim() && !selectedFile) || isLoading) return;

        const userMsg = input;
        const attachment = selectedFile;

        setInput('');
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';

        setMessages(prev => [...prev, { role: 'user', content: userMsg, attachment }]);
        setIsLoading(true);

        try {
            if (!hasDeepSeekKey()) {
                throw new Error("System Error: API Key not configured in environment.");
            }

            const history = messages.map(m => ({
                role: m.role as 'user' | 'assistant' | 'system',
                content: m.content
            }));

            // Append note about attachment
            let finalPrompt = userMsg;
            if (attachment) {
                const typeDesc = attachment.type === 'image' ? 'an image' : `a file named "${attachment.name}"`;
                finalPrompt = `${userMsg}\n\n[System Note: User attached ${typeDesc}. I cannot read files directly yet, but acknowledge it.]`;
            }

            const text = await generateDeepSeekResponse(finalPrompt, history, activeModel);

            setMessages(prev => [...prev, { role: 'assistant', content: text }]);
        } catch (error: any) {
            console.error(error);
            toast({
                title: "Connection Error",
                description: "DeepSeek Core Unreachable.",
                variant: "destructive"
            });
            setMessages(prev => [...prev, { role: 'assistant', content: "Error: Neural link unstable." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[600px] h-[700px] bg-black/95 border-primary/50 text-cyan-400 font-mono shadow-[0_0_50px_rgba(112,0,255,0.2)] flex flex-col p-0 overflow-hidden backdrop-blur-3xl [&>button]:hidden">

                {/* Header */}
                <div className="p-4 border-b border-primary/30 flex justify-between items-center bg-primary/10">
                    <DialogTitle className="flex items-center gap-2 text-primary tracking-widest uppercase text-lg">
                        <Cpu className="h-5 w-5 animate-pulse text-cyan-400" />
                        <div className="flex flex-col">
                            <span>DeepSeek R1 Terminal</span>
                            <div className="flex items-center gap-2 mt-1">
                                <div className={`w-1.5 h-1.5 rounded-full ${activeModel === 'deepseek' ? 'bg-green-500' : 'bg-blue-500'} animate-pulse`} />
                                <select
                                    value={activeModel}
                                    onChange={(e) => setActiveModel(e.target.value as 'deepseek' | 'gemini')}
                                    className="bg-transparent border-none text-[10px] text-gray-400 focus:ring-0 cursor-pointer p-0 h-auto font-normal font-sans tracking-normal uppercase opacity-70 hover:opacity-100"
                                >
                                    <option value="deepseek" className="bg-black text-white">DeepSeek R1 (Logic)</option>
                                    <option value="gemini" className="bg-black text-white">Gemini Flash (Fast)</option>
                                </select>
                            </div>
                        </div>
                    </DialogTitle>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6 text-primary hover:text-white">
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Chat View */}
                <ScrollArea className="flex-1 p-6" ref={scrollRef}>
                    <div className="space-y-6">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-white/10 ${msg.role === 'assistant' ? 'bg-primary/20 text-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.3)]' : 'bg-purple-500/20 text-purple-400'}`}>
                                    {msg.role === 'assistant' ? <Bot className="h-6 w-6" /> : <User className="h-6 w-6" />}
                                </div>
                                <div className={`flex flex-col gap-2 max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    {msg.attachment && msg.attachment.type === 'image' && (
                                        <img src={msg.attachment.content} alt="User Upload" className="rounded-xl border border-white/20 max-w-full max-h-[200px] object-cover" />
                                    )}
                                    {msg.attachment && msg.attachment.type === 'file' && (
                                        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/10 border border-white/20">
                                            <div className="bg-red-500/20 p-2 rounded text-red-400">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>
                                            </div>
                                            <div className="text-xs text-cyan-100/80 font-mono">{msg.attachment.name}</div>
                                        </div>
                                    )}
                                    <div className={`rounded-2xl p-4 text-sm leading-relaxed ${msg.role === 'assistant' ? 'bg-black/40 border border-primary/20 text-cyan-100 shadow-inner' : 'bg-purple-900/20 border border-purple-500/30 text-purple-100'}`}>
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-xl bg-primary/20 text-cyan-400 flex items-center justify-center shrink-0 border border-white/10">
                                    <Bot className="h-6 w-6" />
                                </div>
                                <div className="flex items-center gap-3 text-cyan-400/70 text-sm p-4 animate-pulse">
                                    <Loader2 className="h-4 w-4 animate-spin" /> Thinking...
                                </div>
                            </div>
                        )}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>

                <div className="p-4 border-t border-primary/30 bg-black/80">
                    {/* Preview Area */}
                    {selectedFile && (
                        <div className="mb-2 flex items-center gap-2 p-2 bg-white/5 rounded-lg border border-white/10 w-fit animate-in fade-in slide-in-from-bottom-2">
                            {selectedFile.type === 'image' ? (
                                <img src={selectedFile.content} alt="Preview" className="h-12 w-12 rounded bg-black object-cover" />
                            ) : (
                                <div className="h-12 w-12 rounded bg-red-500/20 flex items-center justify-center text-red-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>
                                </div>
                            )}
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-400">{selectedFile.type === 'image' ? 'Image attached' : 'File attached'}</span>
                                <span className="text-[10px] text-gray-500 max-w-[150px] truncate">{selectedFile.name}</span>
                            </div>
                            <button onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="ml-2 hover:text-white"><X className="h-4 w-4" /></button>
                        </div>
                    )}

                    <form
                        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                        className="flex gap-3"
                    >
                        <input
                            type="file"
                            accept="image/*,.pdf,.pptx,.ppt,.doc,.docx"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileSelect}
                        />
                        <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            className="h-12 w-12 border-primary/50 text-primary hover:bg-primary/10 hover:text-white"
                            disabled={isLoading}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-paperclip"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                        </Button>

                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Query DeepSeek Intelligence..."
                            className="bg-black/50 border-primary/50 text-cyan-400 placeholder:text-cyan-900/50 focus-visible:ring-cyan-500 h-12 text-lg"
                            disabled={isLoading}
                        />
                        <Button type="submit" size="icon" className="h-12 w-12 bg-cyan-600 text-black hover:bg-cyan-500 shadow-[0_0_20px_rgba(0,240,255,0.4)]" disabled={isLoading}>
                            <Send className="h-5 w-5" />
                        </Button>
                    </form>
                </div>

            </DialogContent>
        </Dialog>
    );
};

export default AIChatTerminal;
