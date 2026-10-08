import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetInbox, useUpdateInbox, getGetInboxQueryKey } from "@workspace/api-client-react";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { AppShell } from "@/components/app-shell";
import { ShareLink } from "@/components/share-link";

export default function SettingsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const inbox = useGetInbox();
  const update = useUpdateInbox();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [accepting, setAccepting] = useState(true);
  const init = useRef(false);

  useEffect(() => {
    if (inbox.data && !init.current) {
      init.current = true;
      setName(inbox.data.displayName);
      setBio(inbox.data.bio);
      setAccepting(inbox.data.acceptingMessages);
    }
  }, [inbox.data]);

  const save = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    update.mutate({ data: { displayName: name.trim(), bio: bio.trim(), acceptingMessages: accepting } }, {
      onSuccess: (d) => { qc.setQueryData(getGetInboxQueryKey(), d); qc.invalidateQueries({ queryKey: getGetInboxQueryKey() }); toast({ title: "Saved", description: accepting ? "Your inbox is open." : "Your inbox is paused." }); },
      onError: () => toast({ title: "Couldn't save", description: "Please try again.", variant: "destructive" }),
    });
  };

  return (
    <AppShell>
      <h1 className="rise display text-4xl md:text-5xl">Your page</h1>
      <p className="text-muted-foreground mt-2">What friends see when they open your link.</p>
      {inbox.isLoading ? (
        <div className="mt-8 space-y-4 max-w-xl"><Skeleton className="h-12" /><Skeleton className="h-28" /><Skeleton className="h-16" /></div>
      ) : inbox.isError || !inbox.data ? (
        <div className="mt-8 note-card rounded-2xl p-8 max-w-xl">
          <p>Couldn't load your settings.</p>
          <button onClick={() => inbox.refetch()} className="mt-3 text-primary text-sm" data-testid="button-retry">Try again</button>
        </div>
      ) : (
        <div className="mt-8 grid md:grid-cols-[1fr_320px] gap-10">
          <form onSubmit={save} className="space-y-7">
            <label className="block">
              <span className="text-sm font-medium">Display name</span>
              <input value={name} onChange={(e) => setName(e.target.value.slice(0, 60))} required data-testid="input-display-name"
                className="mt-2 w-full rounded-xl border bg-card px-4 py-3 outline-none focus:ring-2 ring-ring/40" />
            </label>
            <label className="block">
              <span className="text-sm font-medium flex justify-between">Bio <span className="font-mono text-xs text-muted-foreground">{bio.length}/200</span></span>
              <textarea value={bio} onChange={(e) => setBio(e.target.value.slice(0, 200))} rows={3} data-testid="input-bio"
                placeholder="Tell me something you've never said to my face."
                className="mt-2 w-full rounded-xl border bg-card px-4 py-3 outline-none focus:ring-2 ring-ring/40 resize-none" />
            </label>
            <div className={`flex items-center justify-between rounded-2xl p-5 transition-colors ${accepting ? "bg-card border" : "bg-accent"}`}>
              <div>
                <p className="font-medium">{accepting ? "Accepting notes" : "Inbox paused"}</p>
                <p className="text-sm text-muted-foreground">{accepting ? "Anyone with your link can write." : "Your page stays up, but the send form is closed."}</p>
              </div>
              <Switch checked={accepting} onCheckedChange={setAccepting} data-testid="switch-accepting" />
            </div>
            <button type="submit" disabled={update.isPending || !name.trim()} data-testid="button-save"
              className="rounded-full bg-primary text-primary-foreground px-7 py-3 font-medium disabled:opacity-50 active:scale-[.97] transition-transform">
              {update.isPending ? "Saving" : "Save changes"}
            </button>
          </form>
          <aside className="space-y-4">
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Preview</p>
            <div className="rounded-[1.5rem] bg-secondary text-secondary-foreground p-6">
              <h3 className="display text-2xl break-words">{name || "Your name"}</h3>
              <p className="mt-2 text-sm opacity-75 break-words">{bio || "No bio yet."}</p>
            </div>
            <ShareLink handle={inbox.data.handle} />
          </aside>
        </div>
      )}
    </AppShell>
  );
}
