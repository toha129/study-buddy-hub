import React, { useState, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Users, Send, Paperclip, Plus, Settings, Image, FileText, Search, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

interface StudyGroup {
    id: string;
    name: string;
    description: string | null;
    created_by: string;
    created_at: string;
}

interface GroupMember {
    id: string;
    group_id: string;
    user_id: string;
    role: 'admin' | 'member';
    user_email?: string;
}

interface GroupMessage {
    id: string;
    group_id: string;
    user_id: string;
    content: string | null;
    message_type: 'text' | 'image' | 'pdf' | 'pptx';
    attachment_url: string | null;
    attachment_name: string | null;
    created_at: string;
    user_email?: string;
}

const StudyGroups = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
    const [messageInput, setMessageInput] = useState("");
    const [createGroupOpen, setCreateGroupOpen] = useState(false);
    const [addMemberOpen, setAddMemberOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState("");
    const [newGroupDesc, setNewGroupDesc] = useState("");
    const [memberEmail, setMemberEmail] = useState("");

    // Fetch user's groups
    const { data: myGroups = [] } = useQuery({
        queryKey: ['my-groups'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            const { data, error } = await supabase
                .from('group_members')
                .select('group_id, study_groups(*)')
                .eq('user_id', user.id);

            if (error) throw error;
            return (data || []).map((item: any) => item.study_groups as StudyGroup);
        },
    });

    // Fetch messages for active group
    const { data: messages = [] } = useQuery({
        queryKey: ['group-messages', activeGroupId],
        queryFn: async () => {
            if (!activeGroupId) return [];

            const { data, error } = await supabase
                .from('group_messages')
                .select('*')
                .eq('group_id', activeGroupId)
                .order('created_at', { ascending: true });

            if (error) throw error;

            // Fetch user emails
            const messagesWithEmails = await Promise.all(
                (data || []).map(async (msg: any) => {
                    const { data: userData } = await supabase.auth.admin.getUserById(msg.user_id);
                    return { ...msg, user_email: userData?.user?.email || 'Unknown' };
                })
            );

            return messagesWithEmails as GroupMessage[];
        },
        enabled: !!activeGroupId,
    });

    // Fetch members of active group
    const { data: members = [] } = useQuery({
        queryKey: ['group-members', activeGroupId],
        queryFn: async () => {
            if (!activeGroupId) return [];

            const { data, error } = await supabase
                .from('group_members')
                .select('*')
                .eq('group_id', activeGroupId);

            if (error) throw error;

            const membersWithEmails = await Promise.all(
                (data || []).map(async (member: any) => {
                    const { data: userData } = await supabase.auth.admin.getUserById(member.user_id);
                    return { ...member, user_email: userData?.user?.email || 'Unknown' };
                })
            );

            return membersWithEmails as GroupMember[];
        },
        enabled: !!activeGroupId,
    });

    // Subscribe to real-time messages
    useEffect(() => {
        if (!activeGroupId) return;

        const channel = supabase
            .channel(`group-${activeGroupId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'group_messages',
                    filter: `group_id=eq.${activeGroupId}`,
                },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['group-messages', activeGroupId] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [activeGroupId, queryClient]);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Create Group
    const createGroupMutation = useMutation({
        mutationFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const { data: newGroup, error: groupError } = await supabase
                .from('study_groups')
                .insert([{ name: newGroupName, description: newGroupDesc, created_by: user.id }])
                .select()
                .single();

            if (groupError) throw groupError;

            // Add creator as admin
            const { error: memberError } = await supabase
                .from('group_members')
                .insert([{ group_id: newGroup.id, user_id: user.id, role: 'admin' }]);

            if (memberError) throw memberError;
            return newGroup;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-groups'] });
            setCreateGroupOpen(false);
            setNewGroupName("");
            setNewGroupDesc("");
            toast({ title: "Group Created!", description: "Your study group is ready." });
        },
        onError: (error: any) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    // Add Member
    const addMemberMutation = useMutation({
        mutationFn: async () => {
            if (!activeGroupId) throw new Error("No active group");

            // Find user by email
            const { data: users, error: searchError } = await supabase
                .from('profiles')
                .select('id')
                .eq('email', memberEmail)
                .single();

            if (searchError || !users) {
                // Fallback: try auth.users (Note: This requires service role, might not work in client)
                throw new Error("User not found. Make sure they are registered.");
            }

            const { error } = await supabase
                .from('group_members')
                .insert([{ group_id: activeGroupId, user_id: users.id, role: 'member' }]);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['group-members', activeGroupId] });
            setAddMemberOpen(false);
            setMemberEmail("");
            toast({ title: "Member Added", description: "User has been added to the group." });
        },
        onError: (error: any) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    // Send Message
    const sendMessageMutation = useMutation({
        mutationFn: async (data: { content: string; type: 'text' | 'image' | 'pdf' | 'pptx'; attachment?: { url: string; name: string } }) => {
            if (!activeGroupId) throw new Error("No active group");
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const { error } = await supabase
                .from('group_messages')
                .insert([{
                    group_id: activeGroupId,
                    user_id: user.id,
                    content: data.content || null,
                    message_type: data.type,
                    attachment_url: data.attachment?.url || null,
                    attachment_name: data.attachment?.name || null,
                }]);

            if (error) throw error;
        },
        onSuccess: () => {
            setMessageInput("");
            queryClient.invalidateQueries({ queryKey: ['group-messages', activeGroupId] });
        },
        onError: (error: any) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    const handleSendMessage = () => {
        if (!messageInput.trim()) return;
        sendMessageMutation.mutate({ content: messageInput, type: 'text' });
    };

    const handleFileUpload = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            let type: 'image' | 'pdf' | 'pptx' = 'pdf';

            if (file.type.startsWith('image/')) type = 'image';
            else if (file.name.endsWith('.pptx')) type = 'pptx';

            sendMessageMutation.mutate({
                content: `Shared ${file.name}`,
                type,
                attachment: { url: dataUrl, name: file.name }
            });
        };
        reader.readAsDataURL(file);
    };

    const activeGroup = myGroups.find(g => g.id === activeGroupId);

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container mx-auto px-4 py-8">
                <div className="h-[calc(100vh-12rem)] flex gap-4">
                    {/* Sidebar - Groups List */}
                    <Card className="w-80 flex flex-col border-white/10">
                        <div className="p-4 border-b border-white/10">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold">Study Groups</h2>
                                <Button size="sm" onClick={() => setCreateGroupOpen(true)}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            <Input placeholder="Search groups..." className="h-9" />
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {myGroups.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground">
                                    <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                    <p className="text-sm">No groups yet.</p>
                                    <p className="text-xs">Create your first study group!</p>
                                </div>
                            ) : (
                                myGroups.map(group => (
                                    <div
                                        key={group.id}
                                        onClick={() => setActiveGroupId(group.id)}
                                        className={`p-4 border-b border-white/5 cursor-pointer transition-colors ${activeGroupId === group.id ? 'bg-primary/10 border-l-4 border-l-primary' : 'hover:bg-white/5'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                                {group.name[0].toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold truncate">{group.name}</h3>
                                                <p className="text-xs text-muted-foreground truncate">{group.description || 'No description'}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>

                    {/* Main Chat Area */}
                    <Card className="flex-1 flex flex-col border-white/10">
                        {activeGroup ? (
                            <>
                                {/* Chat Header */}
                                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                            {activeGroup.name[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <h2 className="font-bold">{activeGroup.name}</h2>
                                            <p className="text-xs text-muted-foreground">{members.length} members</p>
                                        </div>
                                    </div>
                                    <Button size="sm" variant="ghost" onClick={() => setAddMemberOpen(true)}>
                                        <Users className="h-4 w-4 mr-2" />
                                        Add Member
                                    </Button>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {messages.map(msg => (
                                        <div key={msg.id} className="flex gap-3">
                                            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 text-xs font-bold shrink-0">
                                                {msg.user_email?.[0].toUpperCase()}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-baseline gap-2 mb-1">
                                                    <span className="text-sm font-semibold">{msg.user_email}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(msg.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                {msg.message_type === 'text' ? (
                                                    <p className="text-sm bg-card p-3 rounded-lg border border-white/5">{msg.content}</p>
                                                ) : (
                                                    <a
                                                        href={msg.attachment_url || '#'}
                                                        download={msg.attachment_name}
                                                        className="flex items-center gap-2 text-sm bg-card p-3 rounded-lg border border-white/5 hover:bg-white/5 w-fit"
                                                    >
                                                        {msg.message_type === 'image' && <Image className="h-4 w-4 text-blue-400" />}
                                                        {(msg.message_type === 'pdf' || msg.message_type === 'pptx') && <FileText className="h-4 w-4 text-red-400" />}
                                                        <span>{msg.attachment_name}</span>
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input Bar */}
                                <div className="p-4 border-t border-white/10">
                                    <div className="flex gap-2">
                                        <label className="cursor-pointer p-2 rounded hover:bg-white/10">
                                            <Paperclip className="h-5 w-5 text-muted-foreground" />
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*,.pdf,.pptx"
                                                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                                            />
                                        </label>
                                        <Input
                                            placeholder="Type a message..."
                                            value={messageInput}
                                            onChange={(e) => setMessageInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                            className="flex-1"
                                        />
                                        <Button onClick={handleSendMessage}>
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-muted-foreground">
                                <div className="text-center">
                                    <Users className="h-16 w-16 mx-auto mb-4 opacity-30" />
                                    <p className="text-lg font-semibold">Select a group to start chatting</p>
                                    <p className="text-sm">or create a new study group</p>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>

                {/* Create Group Dialog */}
                <Dialog open={createGroupOpen} onOpenChange={setCreateGroupOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Study Group</DialogTitle>
                            <DialogDescription>Start a new group for collaborative learning</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <label className="text-sm font-medium">Group Name</label>
                                <Input
                                    placeholder="e.g. CS101 Final Prep"
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Description (Optional)</label>
                                <Textarea
                                    placeholder="What is this group about?"
                                    value={newGroupDesc}
                                    onChange={(e) => setNewGroupDesc(e.target.value)}
                                    rows={3}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setCreateGroupOpen(false)}>Cancel</Button>
                            <Button onClick={() => createGroupMutation.mutate()} disabled={!newGroupName.trim()}>
                                Create Group
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Add Member Dialog */}
                <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Member</DialogTitle>
                            <DialogDescription>Invite a user by their registered email</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <label className="text-sm font-medium">Email Address</label>
                                <Input
                                    type="email"
                                    placeholder="user@example.com"
                                    value={memberEmail}
                                    onChange={(e) => setMemberEmail(e.target.value)}
                                />
                            </div>
                            <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg">
                                <p className="text-xs text-yellow-200">Note: The user must already be registered in the app.</p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setAddMemberOpen(false)}>Cancel</Button>
                            <Button onClick={() => addMemberMutation.mutate()} disabled={!memberEmail.trim()}>
                                Add Member
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </main>
        </div>
    );
};

export default StudyGroups;
