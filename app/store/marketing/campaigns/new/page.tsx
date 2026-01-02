"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Users,
  Sparkles,
  Calendar,
  Eye,
  Send,
  Filter,
  Star,
  ShoppingBag,
  Zap,
  Mail,
  X,
  Search,
  Plus,
  Trash2,
} from "lucide-react";
import { useAppAuth } from "@/context/AppAuthContext";
import { showSuccess, showError } from "@/components/NotificationToast";

type Step = "audience" | "content" | "schedule" | "review";

interface Segment {
  id: string;
  name: string;
  description: string;
  icon: any;
  count: number;
}

function NewCampaignPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { vendor } = useAppAuth();
  const templateId = searchParams.get("template");

  const [currentStep, setCurrentStep] = useState<Step>("audience");
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [emailContent, setEmailContent] = useState("");
  const [sendTime, setSendTime] = useState<"now" | "schedule">("now");
  const [scheduledDate, setScheduledDate] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [segmentCounts, setSegmentCounts] = useState<any>(null);
  const [loadingCounts, setLoadingCounts] = useState(true);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [showTestEmailModal, setShowTestEmailModal] = useState(false);
  const [testEmail, setTestEmail] = useState("fahad@cwscommercial.com");
  const [sendingTest, setSendingTest] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Load real segment counts on mount
  useEffect(() => {
    if (vendor) {
      loadSegmentCounts();
    }
  }, [vendor]);

  // Debounced customer search
  useEffect(() => {
    if (!vendor || !customerSearchQuery || customerSearchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setSearching(true);
      try {
        const response = await fetch(
          `/api/vendor/customers/search?q=${encodeURIComponent(customerSearchQuery)}`,
          {
            headers: {
              "x-vendor-id": vendor.id,
            },
          }
        );
        const data = await response.json();

        if (!data.error) {
          setSearchResults(data.customers || []);
        }
      } catch (error) {
        console.error("Failed to search customers:", error);
      } finally {
        setSearching(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [customerSearchQuery, vendor]);

  async function loadSegmentCounts() {
    if (!vendor) return;

    try {
      const response = await fetch("/api/vendor/customers/segments", {
        headers: {
          "x-vendor-id": vendor.id,
        },
      });
      const data = await response.json();

      if (!data.error) {
        setSegmentCounts(data.segments);
      }
    } catch (error) {
      console.error("Failed to load segment counts:", error);
    } finally {
      setLoadingCounts(false);
    }
  }

  const segments: Segment[] = [
    { id: "all", name: "All Customers", description: "Everyone with email addresses", icon: Users, count: segmentCounts?.all || 0 },
    { id: "loyalty", name: "Loyalty Members", description: "Customers enrolled in rewards", icon: Star, count: segmentCounts?.loyalty || 0 },
    { id: "vip", name: "VIP Customers", description: "Gold & Platinum tier members", icon: Star, count: segmentCounts?.vip || 0 },
    { id: "recent", name: "Recent Customers", description: "Purchased in last 30 days", icon: ShoppingBag, count: segmentCounts?.recent || 0 },
    { id: "inactive", name: "Inactive Customers", description: "No purchase in 90+ days", icon: Zap, count: segmentCounts?.inactive || 0 },
    { id: "highValue", name: "High-Value Customers", description: "Spent $500+ lifetime", icon: Star, count: segmentCounts?.highValue || 0 },
    { id: "custom", name: "Custom Segment", description: "Pick specific customers", icon: Filter, count: selectedCustomers.length },
  ];

  const steps = [
    { id: "audience" as Step, label: "Audience", icon: Users },
    { id: "content" as Step, label: "Content", icon: Sparkles },
    { id: "schedule" as Step, label: "Schedule", icon: Calendar },
    { id: "review" as Step, label: "Review", icon: Eye },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  const canGoNext = () => {
    if (currentStep === "audience") {
      if (selectedSegment === "custom") {
        return selectedCustomers.length > 0;
      }
      return selectedSegment !== null;
    }
    if (currentStep === "content") return subject && emailContent;
    return true;
  };

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
    } else {
      router.back();
    }
  };

  const handleGenerateContent = async () => {
    if (!vendor || !aiPrompt.trim()) return;

    setGenerating(true);
    try {
      // Generate HTML email with Claude
      const generateResponse = await fetch("/api/vendor/campaigns/generate-react", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vendor-id": vendor.id,
        },
        body: JSON.stringify({
          prompt: aiPrompt,
          context: {}, // Can add productIds, mediaIds, segmentType later
        }),
      });

      const generateData = await generateResponse.json();

      if (generateData.error) {
        showError(generateData.error);
        return;
      }

      // Update form with generated content
      setSubject(generateData.subject);
      setEmailContent(generateData.html);

      // Extract preview text from HTML
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = generateData.html;
      const textContent = tempDiv.textContent || tempDiv.innerText || "";
      setPreviewText(textContent.substring(0, 150).trim());

      showSuccess("Email generated successfully!");
    } catch (error) {
      console.error("Failed to generate email:", error);
      showError("Failed to generate email. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  async function saveDraftCampaign() {
    if (!vendor) return null;

    try {
      const payload = {
        prompt: subject || "Marketing Campaign", // Use subject as campaign name/prompt
        audience: selectedSegment,
        subject: subject, // AI-generated subject line
        html_content: emailContent, // AI-generated HTML content
        name: subject || "Marketing Campaign", // Campaign name
      };

      console.log('🔍 [SAVE DRAFT] Payload being sent:', {
        hasSubject: !!payload.subject,
        hasHtmlContent: !!payload.html_content,
        htmlContentLength: payload.html_content?.length || 0,
        htmlPreview: payload.html_content?.substring(0, 100),
        payload
      });

      const response = await fetch("/api/vendor/campaigns/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vendor-id": vendor.id,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.error) {
        showError("Failed to create campaign draft", data.error);
        return null;
      }

      return data.campaign.id;
    } catch (error) {
      console.error("Failed to save draft campaign:", error);
      showError("Something went wrong", "Please try again");
      return null;
    }
  }

  async function handleSendTestEmail() {
    if (!vendor || !testEmail.trim()) return;

    setSendingTest(true);

    try {
      // Save draft campaign first if we don't have a campaign ID yet
      let currentCampaignId = campaignId;
      if (!currentCampaignId) {
        currentCampaignId = await saveDraftCampaign();
        if (!currentCampaignId) {
          setSendingTest(false);
          return;
        }
        setCampaignId(currentCampaignId);
      }

      // Send test email
      const response = await fetch(`/api/vendor/campaigns/${currentCampaignId}/test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vendor-id": vendor.id,
        },
        body: JSON.stringify({
          testEmail,
        }),
      });

      const data = await response.json();

      if (data.error) {
        showError("Failed to send test email", data.error);
      } else {
        showSuccess("Test email sent!", `Check ${testEmail} for the preview`);
        setShowTestEmailModal(false);
      }
    } catch (error) {
      console.error("Failed to send test email:", error);
      showError("Something went wrong", "Please try again");
    } finally {
      setSendingTest(false);
    }
  }

  async function handleSend() {
    if (!vendor) return;

    try {
      // Use existing campaign if we have one from test email, otherwise create new
      let finalCampaignId = campaignId;

      if (!finalCampaignId) {
        finalCampaignId = await saveDraftCampaign();
        if (!finalCampaignId) {
          showError("Failed to create campaign");
          return;
        }
      }

      showSuccess("Campaign created", "Your campaign is ready");
      router.push(`/vendor/marketing/campaigns`);
    } catch (error) {
      console.error("Failed to create campaign:", error);
      showError("Something went wrong", "Please try again");
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-8">
          <button onClick={handleBack} className="flex items-center gap-2 text-white/40 hover:text-white/70 text-sm mb-6 transition-colors">
            <ArrowLeft size={16} strokeWidth={1.5} />
            Back
          </button>

          <div className="flex items-center gap-3 mb-6">
            {vendor?.logo_url && (
              <div className="relative w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.06] overflow-hidden flex items-center justify-center">
                <Image src={vendor.logo_url} alt={vendor.store_name || "Store Logo"} width={48} height={48} className="object-contain p-1.5" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-light text-white/90 tracking-tight">Create Campaign</h1>
              <p className="text-[11px] text-white/30 mt-0.5 tracking-wide">AI-powered email in 4 simple steps</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStepIndex > index;

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className={`flex items-center gap-2 px-4 py-3 rounded-xl flex-1 transition-all duration-300 ${isActive ? "bg-white/[0.08] border border-white/[0.12]" : isCompleted ? "bg-white/[0.04] border border-white/[0.06]" : "bg-white/[0.02] border border-white/[0.04]"}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? "bg-white/[0.12]" : isCompleted ? "bg-white/[0.08]" : "bg-white/[0.04]"}`}>
                      {isCompleted ? <Check size={16} className="text-white/70" strokeWidth={2} /> : <Icon size={16} className={isActive ? "text-white/70" : "text-white/30"} strokeWidth={1.5} />}
                    </div>
                    <span className={`text-xs font-light uppercase tracking-[0.1em] ${isActive ? "text-white/80" : "text-white/40"}`}>{step.label}</span>
                  </div>
                  {index < steps.length - 1 && <div className="w-2 h-[1px] bg-white/[0.06] flex-shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white/[0.02] border border-white/[0.06] rounded-3xl overflow-hidden">
          {currentStep === "audience" && (
            <div className="p-8">
              <div className="mb-6">
                <h2 className="text-lg font-light text-white/90 tracking-tight mb-2">Who should receive this campaign?</h2>
                <p className="text-xs text-white/40 font-light">Choose a pre-built segment or create custom filters</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {segments.map((segment) => {
                  const Icon = segment.icon;
                  const isSelected = selectedSegment === segment.id;

                  return (
                    <button
                      key={segment.id}
                      onClick={() => setSelectedSegment(segment.id)}
                      className={`group text-left bg-white/[0.02] border rounded-2xl p-6 hover:bg-white/[0.04] transition-all duration-200 ${isSelected ? "border-white/[0.2] bg-white/[0.06]" : "border-white/[0.06] hover:border-white/[0.08]"}`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                          <Icon className={`w-5 h-5 transition-colors ${isSelected ? "text-white/70" : "text-white/40"}`} strokeWidth={1.5} />
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-white/[0.12] flex items-center justify-center">
                            <Check size={14} className="text-white/80" strokeWidth={2} />
                          </div>
                        )}
                      </div>
                      <h3 className="text-sm font-light text-white/90 mb-1 tracking-tight">{segment.name}</h3>
                      <p className="text-xs text-white/40 font-light mb-3">{segment.description}</p>
                      <div className="flex items-center gap-2">
                        <Users className="w-3 h-3 text-white/30" strokeWidth={1.5} />
                        <span className="text-xs text-white/30">{segment.count.toLocaleString()} customers</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Custom Segment Customer Search */}
              {selectedSegment === "custom" && (
                <div className="mt-6 bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
                  <h3 className="text-sm font-light text-white/90 mb-4 tracking-tight">Select Specific Customers</h3>

                  {/* Search Bar */}
                  <div className="relative mb-4">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" strokeWidth={1.5} />
                    <input
                      type="text"
                      value={customerSearchQuery}
                      onChange={(e) => setCustomerSearchQuery(e.target.value)}
                      placeholder="Search by name or email..."
                      className="w-full bg-white/[0.04] border border-white/[0.06] text-white/80 pl-11 pr-4 py-3 rounded-xl text-sm font-light focus:outline-none focus:border-white/[0.1] focus:bg-white/[0.06] transition-all placeholder:text-white/20"
                    />
                  </div>

                  {/* Search Results */}
                  {customerSearchQuery.trim().length >= 2 && (
                    <div className="mb-4">
                      {searching ? (
                        <div className="text-center py-8 text-white/40 text-sm">Searching...</div>
                      ) : searchResults.length > 0 ? (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                          {searchResults.map((customer) => {
                            const isSelected = selectedCustomers.some((c) => c.id === customer.id);
                            return (
                              <button
                                key={customer.id}
                                onClick={() => {
                                  if (isSelected) {
                                    setSelectedCustomers(selectedCustomers.filter((c) => c.id !== customer.id));
                                  } else {
                                    setSelectedCustomers([...selectedCustomers, customer]);
                                  }
                                }}
                                className={`w-full text-left bg-white/[0.02] border rounded-xl p-4 hover:bg-white/[0.04] transition-all ${
                                  isSelected ? "border-white/[0.2] bg-white/[0.06]" : "border-white/[0.06]"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm text-white/80 font-light">{customer.name}</div>
                                    <div className="text-xs text-white/40 truncate">{customer.email}</div>
                                  </div>
                                  {isSelected && (
                                    <div className="w-6 h-6 rounded-full bg-white/[0.12] flex items-center justify-center ml-3">
                                      <Check size={14} className="text-white/80" strokeWidth={2} />
                                    </div>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-white/40 text-sm">No customers found</div>
                      )}
                    </div>
                  )}

                  {/* Selected Customers */}
                  {selectedCustomers.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/[0.06]">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs uppercase tracking-[0.15em] text-white/40 font-light">
                          Selected ({selectedCustomers.length})
                        </h4>
                        <button
                          onClick={() => setSelectedCustomers([])}
                          className="text-xs text-white/40 hover:text-white/70 transition-colors"
                        >
                          Clear All
                        </button>
                      </div>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {selectedCustomers.map((customer) => (
                          <div
                            key={customer.id}
                            className="flex items-center justify-between bg-white/[0.04] border border-white/[0.06] rounded-lg p-3"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-white/80 font-light">{customer.name}</div>
                              <div className="text-xs text-white/40 truncate">{customer.email}</div>
                            </div>
                            <button
                              onClick={() => setSelectedCustomers(selectedCustomers.filter((c) => c.id !== customer.id))}
                              className="w-6 h-6 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center ml-3 transition-colors"
                            >
                              <Trash2 size={14} className="text-white/40" strokeWidth={1.5} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {currentStep === "content" && (
            <div className="p-8">
              <div className="mb-6">
                <h2 className="text-lg font-light text-white/90 tracking-tight mb-2">What should the email say?</h2>
                <p className="text-xs text-white/40 font-light">Let AI generate compelling content or write your own</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.08] rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-5 h-5 text-white/60" strokeWidth={1.5} />
                      <h3 className="text-sm font-light text-white/80 tracking-tight">AI Content Generator</h3>
                    </div>
                    <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="Describe your campaign... (e.g., '24-hour flash sale with 30% off everything')" className="w-full bg-white/[0.04] border border-white/[0.06] text-white/80 px-4 py-3 rounded-xl text-sm font-light focus:outline-none focus:border-white/[0.1] focus:bg-white/[0.06] transition-all resize-none placeholder:text-white/20" rows={3} />
                    <button onClick={handleGenerateContent} disabled={!aiPrompt.trim() || generating} className="w-full mt-3 bg-white text-black px-4 py-3 rounded-xl text-[11px] uppercase tracking-[0.15em] font-medium hover:bg-white/90 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                      {generating ? <><Sparkles size={14} className="animate-pulse" strokeWidth={2} />Generating...</> : <><Sparkles size={14} strokeWidth={2} />Generate Content</>}
                    </button>
                  </div>

                  <div>
                    <label className="text-[11px] uppercase tracking-[0.15em] text-white/40 mb-2 block font-light">Subject Line</label>
                    <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Enter email subject..." className="w-full bg-white/[0.02] border border-white/[0.06] text-white/80 px-4 py-3 rounded-xl text-sm font-light focus:outline-none focus:border-white/[0.1] focus:bg-white/[0.04] transition-all placeholder:text-white/20" />
                  </div>

                  <div>
                    <label className="text-[11px] uppercase tracking-[0.15em] text-white/40 mb-2 block font-light">Preview Text</label>
                    <input type="text" value={previewText} onChange={(e) => setPreviewText(e.target.value)} placeholder="Appears below subject in inbox..." className="w-full bg-white/[0.02] border border-white/[0.06] text-white/80 px-4 py-3 rounded-xl text-sm font-light focus:outline-none focus:border-white/[0.1] focus:bg-white/[0.04] transition-all placeholder:text-white/20" />
                  </div>

                  <div>
                    <label className="text-[11px] uppercase tracking-[0.15em] text-white/40 mb-2 block font-light">Email Content</label>
                    <textarea value={emailContent} onChange={(e) => setEmailContent(e.target.value)} placeholder="Write your message..." className="w-full bg-white/[0.02] border border-white/[0.06] text-white/80 px-4 py-3 rounded-xl text-sm font-light focus:outline-none focus:border-white/[0.1] focus:bg-white/[0.04] transition-all resize-none placeholder:text-white/20" rows={8} />
                  </div>
                </div>

                <div>
                  <div className="sticky top-6">
                    <h3 className="text-[11px] uppercase tracking-[0.15em] text-white/40 mb-3 font-light">Email Preview</h3>
                    <div className="bg-white rounded-2xl border border-white/[0.1] overflow-hidden">
                      {emailContent ? (
                        <iframe
                          srcDoc={emailContent}
                          className="w-full h-[600px] border-0"
                          title="Email Preview"
                          sandbox="allow-same-origin allow-scripts"
                        />
                      ) : (
                        <div className="bg-[#0a0a0a] p-6">
                          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/[0.06]">
                            {vendor?.logo_url && (
                              <div className="w-10 h-10 rounded-lg bg-white/[0.08] flex items-center justify-center overflow-hidden">
                                <Image src={vendor.logo_url} alt={vendor.store_name || "Store"} width={40} height={40} className="object-contain w-full h-full p-1" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">{vendor?.store_name || "Your Store"}</div>
                              <div className="text-sm text-white/90 font-light truncate">{subject || "Email Subject"}</div>
                            </div>
                          </div>
                          <div className="text-sm text-white/40 font-light text-center py-12">
                            Generate content with AI to see a beautiful preview
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === "schedule" && (
            <div className="p-8">
              <div className="mb-6">
                <h2 className="text-lg font-light text-white/90 tracking-tight mb-2">When should we send it?</h2>
                <p className="text-xs text-white/40 font-light">Send immediately or schedule for later</p>
              </div>

              <div className="max-w-2xl space-y-4">
                <button onClick={() => setSendTime("now")} className={`w-full text-left bg-white/[0.02] border rounded-2xl p-6 hover:bg-white/[0.04] transition-all duration-200 ${sendTime === "now" ? "border-white/[0.2] bg-white/[0.06]" : "border-white/[0.06] hover:border-white/[0.08]"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                        <Zap className="w-5 h-5 text-white/60" strokeWidth={1.5} />
                      </div>
                      <div>
                        <h3 className="text-sm font-light text-white/90 mb-1 tracking-tight">Send Now</h3>
                        <p className="text-xs text-white/40 font-light">Campaign will be sent immediately after review</p>
                      </div>
                    </div>
                    {sendTime === "now" && (
                      <div className="w-6 h-6 rounded-full bg-white/[0.12] flex items-center justify-center flex-shrink-0">
                        <Check size={14} className="text-white/80" strokeWidth={2} />
                      </div>
                    )}
                  </div>
                </button>

                <button onClick={() => setSendTime("schedule")} className={`w-full text-left bg-white/[0.02] border rounded-2xl p-6 hover:bg-white/[0.04] transition-all duration-200 ${sendTime === "schedule" ? "border-white/[0.2] bg-white/[0.06]" : "border-white/[0.06] hover:border-white/[0.08]"}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-white/60" strokeWidth={1.5} />
                      </div>
                      <div>
                        <h3 className="text-sm font-light text-white/90 mb-1 tracking-tight">Schedule for Later</h3>
                        <p className="text-xs text-white/40 font-light">Choose exact date and time</p>
                      </div>
                    </div>
                    {sendTime === "schedule" && (
                      <div className="w-6 h-6 rounded-full bg-white/[0.12] flex items-center justify-center flex-shrink-0">
                        <Check size={14} className="text-white/80" strokeWidth={2} />
                      </div>
                    )}
                  </div>
                  {sendTime === "schedule" && (
                    <div className="ml-16">
                      <input type="datetime-local" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.06] text-white/80 px-4 py-3 rounded-xl text-sm font-light focus:outline-none focus:border-white/[0.1] focus:bg-white/[0.06] transition-all" />
                    </div>
                  )}
                </button>
              </div>
            </div>
          )}

          {currentStep === "review" && (
            <div className="p-8">
              <div className="mb-6">
                <h2 className="text-lg font-light text-white/90 tracking-tight mb-2">Review & Send</h2>
                <p className="text-xs text-white/40 font-light">Double-check everything before sending</p>
              </div>

              <div className="max-w-3xl space-y-6">
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
                  <h3 className="text-[11px] uppercase tracking-[0.15em] text-white/40 mb-4 font-light">Campaign Summary</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-3 border-b border-white/[0.04]">
                      <span className="text-xs text-white/40">Audience</span>
                      <span className="text-sm text-white/80 font-light">{segments.find((s) => s.id === selectedSegment)?.name}</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-white/[0.04]">
                      <span className="text-xs text-white/40">Recipients</span>
                      <span className="text-sm text-white/80 font-light">{segments.find((s) => s.id === selectedSegment)?.count.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-white/[0.04]">
                      <span className="text-xs text-white/40">Subject</span>
                      <span className="text-sm text-white/80 font-light truncate max-w-md">{subject}</span>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <span className="text-xs text-white/40">Send Time</span>
                      <span className="text-sm text-white/80 font-light">{sendTime === "now" ? "Immediately" : scheduledDate}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
                  <h3 className="text-[11px] uppercase tracking-[0.15em] text-white/40 mb-4 font-light">Final Preview</h3>
                  <div className="bg-white rounded-xl overflow-hidden border border-white/[0.08]">
                    {emailContent ? (
                      <iframe
                        srcDoc={emailContent}
                        className="w-full h-[600px] border-0"
                        title="Email Preview"
                        sandbox="allow-same-origin allow-scripts"
                      />
                    ) : (
                      <div className="bg-[#0a0a0a] p-6">
                        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/[0.06]">
                          {vendor?.logo_url && (
                            <div className="w-10 h-10 rounded-lg bg-white/[0.08] flex items-center justify-center overflow-hidden">
                              <Image src={vendor.logo_url} alt={vendor.store_name || "Store"} width={40} height={40} className="object-contain w-full h-full p-1" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">{vendor?.store_name || "Your Store"}</div>
                            <div className="text-sm text-white/90 font-light truncate">{subject || "Email Subject"}</div>
                          </div>
                        </div>
                        <div className="text-sm text-white/40 font-light text-center py-12">
                          Create content to see preview
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
                  <h3 className="text-[11px] uppercase tracking-[0.15em] text-white/40 mb-4 font-light">Test Before Sending</h3>
                  <p className="text-sm text-white/50 font-light mb-4">Send a test email to yourself to see how it looks in your inbox</p>
                  <button
                    onClick={() => setShowTestEmailModal(true)}
                    className="bg-white/[0.08] border border-white/[0.1] text-white px-6 py-3 rounded-xl text-[11px] uppercase tracking-[0.15em] font-medium hover:bg-white/[0.12] transition-all duration-200 flex items-center gap-2"
                  >
                    <Mail size={14} strokeWidth={2} />
                    Send Test Email
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Test Email Modal */}
          {showTestEmailModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-[#111] border border-white/[0.1] rounded-3xl p-8 max-w-md w-full">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/[0.08] flex items-center justify-center">
                      <Mail className="w-6 h-6 text-white/70" strokeWidth={1.5} />
                    </div>
                    <h2 className="text-lg font-light text-white/90 tracking-tight">Send Test Email</h2>
                  </div>
                  <button
                    onClick={() => setShowTestEmailModal(false)}
                    className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition-colors"
                  >
                    <X size={16} className="text-white/60" strokeWidth={1.5} />
                  </button>
                </div>

                <p className="text-sm text-white/50 font-light mb-6">
                  We'll send a preview of your campaign to this email address so you can see exactly how it will look.
                </p>

                <div className="mb-6">
                  <label className="text-[11px] uppercase tracking-[0.15em] text-white/40 mb-2 block font-light">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="Enter email address..."
                    className="w-full bg-white/[0.04] border border-white/[0.06] text-white/80 px-4 py-3 rounded-xl text-sm font-light focus:outline-none focus:border-white/[0.1] focus:bg-white/[0.06] transition-all placeholder:text-white/20"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowTestEmailModal(false)}
                    className="flex-1 bg-white/[0.04] border border-white/[0.06] text-white/60 px-6 py-3 rounded-xl text-[11px] uppercase tracking-[0.15em] font-medium hover:bg-white/[0.06] transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendTestEmail}
                    disabled={!testEmail.trim() || sendingTest}
                    className="flex-1 bg-white text-black px-6 py-3 rounded-xl text-[11px] uppercase tracking-[0.15em] font-medium hover:bg-white/90 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {sendingTest ? (
                      <>
                        <Mail size={14} className="animate-pulse" strokeWidth={2} />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail size={14} strokeWidth={2} />
                        Send Test
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-6">
          <button onClick={handleBack} className="px-6 py-3 rounded-xl text-[11px] uppercase tracking-[0.15em] font-medium text-white/60 hover:text-white/80 transition-colors">
            {currentStepIndex === 0 ? "Cancel" : "Back"}
          </button>

          {currentStep === "review" ? (
            <button onClick={handleSend} className="bg-white text-black px-8 py-3 rounded-xl text-[11px] uppercase tracking-[0.15em] font-medium hover:bg-white/90 transition-all duration-200 flex items-center gap-2">
              <Send size={14} strokeWidth={2} />
              {sendTime === "now" ? "Send Campaign" : "Schedule Campaign"}
            </button>
          ) : (
            <button onClick={handleNext} disabled={!canGoNext()} className="bg-white text-black px-8 py-3 rounded-xl text-[11px] uppercase tracking-[0.15em] font-medium hover:bg-white/90 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
              Continue
              <ArrowRight size={14} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NewCampaignPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div></div>}>
      <NewCampaignPageContent />
    </Suspense>
  );
}
