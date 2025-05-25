'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Copy, 
  Check, 
  Share2, 
  Mail, 
  MessageSquare, 
  QrCode,
  ExternalLink
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Challenge } from '@/types';

interface InvitationCodeShareProps {
  challenge: Challenge;
  variant?: 'full' | 'compact' | 'button-only';
  className?: string;
}

export default function InvitationCodeShare({ 
  challenge, 
  variant = 'full',
  className = '' 
}: InvitationCodeShareProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailData, setEmailData] = useState({
    to: '',
    subject: `Join my Weight Challenge: ${challenge.name}`,
    message: `Hi there!\n\nI've created a weight challenge called "${challenge.name}" and would love for you to join me!\n\nChallenge Details:\n- Start Date: ${challenge.startDate ? new Date(challenge.startDate).toLocaleDateString() : 'TBD'}\n- End Date: ${new Date(challenge.endDate).toLocaleDateString()}\n- Duration: ${challenge.startDate ? Math.ceil((new Date(challenge.endDate).getTime() - new Date(challenge.startDate).getTime()) / (1000 * 60 * 60 * 24)) : 'TBD'} days\n\nTo join, use this invitation code: ${challenge.invitationCode}\n\nOr click this link: ${window.location.origin}/challenges/join?code=${challenge.invitationCode}\n\nLet's motivate each other to reach our goals!\n\nBest regards`
  });

  const joinUrl = `${window.location.origin}/challenges/join?code=${challenge.invitationCode}`;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handleNativeShare = async () => {
    const shareData = {
      title: `Join my Weight Challenge: ${challenge.name}`,
      text: `I've created a weight challenge and would love for you to join me! Use invitation code: ${challenge.invitationCode}`,
      url: joinUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing:', err);
        // Fallback to copying
        copyToClipboard(joinUrl);
      }
    } else {
      // Fallback to copying
      copyToClipboard(joinUrl);
    }
  };

  const handleSocialShare = (platform: 'whatsapp' | 'telegram' | 'twitter') => {
    const text = `Join my Weight Challenge: ${challenge.name}! Use invitation code: ${challenge.invitationCode} or visit: ${joinUrl}`;
    const encodedText = encodeURIComponent(text);
    const encodedUrl = encodeURIComponent(joinUrl);

    let shareUrl = '';
    switch (platform) {
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodedText}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(`Join my Weight Challenge: ${challenge.name}!`)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(emailData.subject);
    const body = encodeURIComponent(emailData.message);
    const mailtoUrl = `mailto:${emailData.to}?subject=${subject}&body=${body}`;
    
    window.location.href = mailtoUrl;
    setShowEmailForm(false);
  };

  if (variant === 'button-only') {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className={className}>
            <Share2 className="h-4 w-4 mr-2" />
            Share Invitation
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Challenge Invitation</DialogTitle>
          </DialogHeader>
          <InvitationCodeShare challenge={challenge} variant="compact" />
        </DialogContent>
      </Dialog>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* Invitation Code */}
        <div>
          <Label className="text-sm font-medium">Invitation Code</Label>
          <div className="flex items-center gap-2 mt-1">
            <Input
              value={challenge.invitationCode}
              readOnly
              className="font-mono text-center"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(challenge.invitationCode)}
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button onClick={handleNativeShare} className="flex-1">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Dialog open={showQR} onOpenChange={setShowQR}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <QrCode className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>QR Code</DialogTitle>
              </DialogHeader>
              <div className="flex justify-center p-4">
                <QRCodeSVG value={joinUrl} size={200} />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Scan this QR code to join the challenge
              </p>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  // Full variant
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Share Challenge Invitation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Invitation Code Section */}
        <div>
          <Label className="text-sm font-medium">Invitation Code</Label>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 p-3 bg-muted rounded-lg border-2 border-dashed">
              <code className="text-lg font-mono font-bold text-center block">
                {challenge.invitationCode}
              </code>
            </div>
            <Button
              variant="outline"
              onClick={() => copyToClipboard(challenge.invitationCode)}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Code
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Join Link Section */}
        <div>
          <Label className="text-sm font-medium">Direct Join Link</Label>
          <div className="flex items-center gap-2 mt-2">
            <Input
              value={joinUrl}
              readOnly
              className="text-sm"
            />
            <Button
              variant="outline"
              onClick={() => copyToClipboard(joinUrl)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Sharing Options */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Share Options</Label>
          
          {/* Primary Actions */}
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={handleNativeShare} className="w-full">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Dialog open={showEmailForm} onOpenChange={setShowEmailForm}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Send Email Invitation</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email-to">To (Email Address)</Label>
                    <Input
                      id="email-to"
                      type="email"
                      value={emailData.to}
                      onChange={(e) => setEmailData(prev => ({ ...prev, to: e.target.value }))}
                      placeholder="friend@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email-subject">Subject</Label>
                    <Input
                      id="email-subject"
                      value={emailData.subject}
                      onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email-message">Message</Label>
                    <Textarea
                      id="email-message"
                      value={emailData.message}
                      onChange={(e) => setEmailData(prev => ({ ...prev, message: e.target.value }))}
                      rows={8}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleEmailShare} className="flex-1">
                      <Mail className="h-4 w-4 mr-2" />
                      Send Email
                    </Button>
                    <Button variant="outline" onClick={() => setShowEmailForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Social Media */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSocialShare('whatsapp')}
              className="w-full"
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              WhatsApp
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSocialShare('telegram')}
              className="w-full"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Telegram
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSocialShare('twitter')}
              className="w-full"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Twitter
            </Button>
          </div>

          {/* QR Code */}
          <Dialog open={showQR} onOpenChange={setShowQR}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <QrCode className="h-4 w-4 mr-2" />
                Show QR Code
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>QR Code for Challenge</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex justify-center p-6 bg-white rounded-lg">
                  <QRCodeSVG 
                    value={joinUrl} 
                    size={200}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    level="M"
                    includeMargin={true}
                  />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Scan this QR code to join the challenge
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Or share this image with friends
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
} 