import { prisma } from "@/lib/db";
import { verifyReplyToken } from "@/lib/ai/reply-drafter";
import { QuickReplyCard } from "@/components/public/QuickReplyCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<{
    id?: string;
    token?: string;
  }>;
}

export const metadata = {
  title: "Reply to Contact Message | Kishore R",
  description: "Review and send professional AI-drafted reply to contact inquiry.",
};

export default async function ContactReplyPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { id, token } = params;

  if (!id || !token) {
    return <InvalidLinkView message="Missing message ID or security token." />;
  }

  const contactMessage = await prisma.contactMessage.findUnique({
    where: { id },
  });

  if (!contactMessage) {
    return <InvalidLinkView message="Contact message was not found or may have been removed." />;
  }

  const isValid = verifyReplyToken(contactMessage.id, contactMessage.email, token);
  if (!isValid) {
    return <InvalidLinkView message="Invalid or expired authorization token." />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 pt-24 sm:pt-28">
      <div className="w-full max-w-2xl mb-4">
        <Button
          render={<Link href="/" />}
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Portfolio
        </Button>
      </div>

      <QuickReplyCard
        message={{
          id: contactMessage.id,
          name: contactMessage.name,
          email: contactMessage.email,
          subject: contactMessage.subject,
          message: contactMessage.message,
          draftReply: contactMessage.draftReply,
          replied: contactMessage.replied,
          repliedAt: contactMessage.repliedAt,
          createdAt: contactMessage.createdAt,
        }}
        token={token}
      />
    </div>
  );
}

function InvalidLinkView({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center p-4">
      <Card className="max-w-md w-full border-border/80 bg-card shadow-xl p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <CardHeader className="p-0">
          <CardTitle className="text-lg font-semibold text-foreground">
            Unable to Open Reply
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {message}
          </p>
        </CardHeader>
        <CardContent className="p-0 pt-2 flex flex-col gap-2">
          <Button
            render={<Link href="/admin/messages" />}
            size="sm"
            className="w-full text-xs font-semibold"
          >
            Manage Messages in Admin Panel
          </Button>
          <Button
            render={<Link href="/" />}
            variant="outline"
            size="sm"
            className="w-full text-xs"
          >
            Back to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
