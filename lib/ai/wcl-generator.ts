/**
 * AI WCL Generator - Claude generates WCL components with Exa research
 */

import { Anthropic } from '@anthropic-ai/sdk';
import { ExaClient, formatExaResultsForAI, extractDesignInsights } from './exa-client';

export interface WCLGenerationRequest {
  goal: string;
  context: {
    vendorType?: string;
    industry?: string;
    targetAudience?: string;
    style?: string;
  };
  requirements?: string[];
  enableResearch?: boolean; // Default: true
}

export class WCLGenerator {
  private claude: Anthropic;
  private exa: ExaClient;
  
  constructor() {
    this.claude = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!
    });
    this.exa = new ExaClient(process.env.EXA_API_KEY);
  }
  
  async generateComponent(request: WCLGenerationRequest): Promise<string> {
    const { goal, context, requirements, enableResearch = true } = request;
    
    // PHASE 1: DEEP RESEARCH WITH EXA (if enabled)
    let researchContext = '';
    
    if (enableResearch && context.industry) {
      console.log('🔍 Starting deep research with Exa...');
      
      try {
        // Parallel research queries
        const [designResults, bestPractices, trends] = await Promise.all([
          this.exa.searchDesignInspiration(goal, context.industry),
          this.exa.searchBestPractices('homepage layout', context.industry),
          this.exa.researchTrends(context.industry, 2025)
        ]);
        
        console.log('✅ Exa research complete:', {
          design: designResults.length,
          practices: bestPractices.length,
          trends: trends.length
        });
        
        // Extract actionable insights
        const insights = extractDesignInsights([...designResults, ...bestPractices, ...trends]);
        
        researchContext = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔬 DEEP RESEARCH FINDINGS (via Exa)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${formatExaResultsForAI(designResults)}

📊 DESIGN INSIGHTS EXTRACTED:

Color Schemes:
${insights.colorSchemes.slice(0, 5).map(c => `• ${c}`).join('\n')}

Layout Patterns:
${insights.layoutPatterns.slice(0, 5).map(l => `• ${l}`).join('\n')}

Typography Trends:
${insights.typography.slice(0, 5).map(t => `• ${t}`).join('\n')}

Animation Patterns:
${insights.animations.slice(0, 5).map(a => `• ${a}`).join('\n')}

Best Practices:
${insights.bestPractices.slice(0, 8).map(bp => `• ${bp}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

USE THIS RESEARCH to inform your design decisions. Apply modern trends, 
proven best practices, and industry-specific patterns to create a 
world-class component.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
      } catch (error) {
        console.warn('⚠️ Exa research failed, continuing without it:', error);
      }
    }
    
    // PHASE 2: GENERATE WCL WITH RESEARCH CONTEXT
    const prompt = `
You are an expert in WCL (WhaleTools Component Language), a domain-specific language for e-commerce components.

${researchContext}

TASK: Generate a WCL component based on this request:
"${goal}"

CONTEXT:
- Vendor Type: ${context.vendorType || 'general'}
- Industry: ${context.industry || 'e-commerce'}
- Target Audience: ${context.targetAudience || 'general consumers'}
- Style: ${context.style || 'modern luxury'}

APPLY THE RESEARCH FINDINGS ABOVE:
- Use proven color schemes and patterns
- Apply modern typography trends
- Include contemporary animations
- Follow best practices for conversion
- Incorporate industry-specific patterns

WCL SYNTAX RULES:
1. Component structure:
   component ComponentName {
     props { ... }
     data { ... }
     render { ... }
   }

2. Props syntax:
   propName: Type = defaultValue

3. Data fetching:
   dataName = fetch("/api/endpoint") @cache(duration)

4. Quantum rendering (multiple states):
   render {
     quantum {
       state StateName when condition {
         <JSX template>
       }
     }
   }

5. Simple rendering:
   render {
     <JSX template>
   }

DESIGN SYSTEM (WhaleTools):
- Background: bg-black or bg-[#0a0a0a]
- Text: text-white (headings), text-white/60 (body), text-white/40 (labels)
- Borders: border-white/5, hover:border-white/10
- Rounded: rounded-2xl (iOS 26 style)
- Typography: font-black uppercase tracking-tight for headings
- Buttons: bg-white text-black rounded-2xl font-black uppercase

CRITICAL: RESPONSIVE DESIGN RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ NEVER use quantum states for mobile/desktop/tablet
❌ NEVER write separate layouts for different screen sizes
✅ ALWAYS use Tailwind responsive utilities (sm: md: lg:)
✅ Reserve quantum states for USER BEHAVIOR only

RESPONSIVE DESIGN (Built-in via Tailwind):
• Typography: text-3xl sm:text-5xl md:text-7xl
• Spacing: py-12 sm:py-16 md:py-20
• Grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
• Padding: px-4 sm:px-6 md:px-8

QUANTUM STATES (For behavior only):
• First-time visitors vs returning users
• High-intent shoppers vs browsers
• Cart abandonment recovery
• Time-based urgency
• Scroll depth engagement

CORRECT EXAMPLE - Responsive with Tailwind:
component SmartTestimonials {
  props {
    headline: String = "WHAT CUSTOMERS SAY"
    maxReviews: Number = 6
  }
  
  data {
    reviews = fetch("/api/reviews") @cache(10m)
  }
  
  render {
    <div className="py-12 sm:py-16 md:py-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase mb-8 sm:mb-12 text-center">{headline}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {reviews.slice(0, maxReviews).map(review => (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 hover:bg-white/10 transition-colors">
              <p className="text-white/60 text-sm sm:text-base mb-4">{review.text}</p>
              <div className="text-white font-bold text-base sm:text-lg">{review.author}</div>
              <div className="text-white/40 text-xs sm:text-sm">{review.role}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  }
}

CORRECT EXAMPLE - Quantum for Behavior:
component SmartHero {
  props {
    headline: String = "WELCOME"
  }
  
  data {
    user = fetch("/api/user/context")
  }
  
  render {
    quantum {
      state FirstVisit when user.visits == 1 {
        <div className="py-16 sm:py-20 px-4 sm:px-6">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black uppercase mb-6">{headline}</h1>
          <p className="text-lg sm:text-xl text-white/60 mb-8">Get 20% off your first order</p>
          <button className="bg-white text-black px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-black uppercase text-sm sm:text-base">SHOP NOW - 20% OFF</button>
        </div>
      }
      
      state Returning when user.visits > 1 {
        <div className="py-16 sm:py-20 px-4 sm:px-6">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black uppercase mb-6">WELCOME BACK</h1>
          <p className="text-lg sm:text-xl text-white/60 mb-8">Continue where you left off</p>
          <button className="bg-white text-black px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-black uppercase text-sm sm:text-base">VIEW YOUR FAVORITES</button>
        </div>
      }
      
      state HighIntent when user.cartAbandoned {
        <div className="py-16 sm:py-20 px-4 sm:px-6 bg-gradient-to-br from-red-900/20 to-black border-t border-red-500/20">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black uppercase mb-6 text-red-500">COMPLETE YOUR ORDER</h1>
          <p className="text-lg sm:text-xl text-white/60 mb-8">Your items are waiting - Get 10% off if you checkout now</p>
          <button className="bg-red-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-black uppercase text-sm sm:text-base animate-pulse">CHECKOUT NOW - SAVE 10%</button>
        </div>
      }
    }
  }
}

REQUIREMENTS:
${request.requirements?.map(req => `- ${req}`).join('\n') || '- Make it visually appealing\n- Use responsive Tailwind utilities for all screen sizes\n- Use quantum states ONLY for user behavior (if applicable)\n- Use WhaleTools design system'}

Generate ONLY the WCL code, no explanations:`;

    let conversationMessages: any[] = [{ role: 'user', content: prompt }];
    let wcl_code = '';
    
    // Multi-turn conversation to handle tool use
    while (!wcl_code) {
      const response = await this.claude.messages.create({
        model: 'claude-sonnet-4-5-20250929', // Latest
        max_tokens: 16000, // Large for complete components
        temperature: 1.0, // More creative and thorough
        messages: conversationMessages
      });

      // Check if response contains tool use
      const toolUseBlock = response.content.find(block => block.type === 'tool_use');
      
      if (toolUseBlock && toolUseBlock.type === 'tool_use') {
        // AI wants to use a tool - in a real implementation, we'd execute it
        // For now, we'll just acknowledge and ask for the final WCL
        conversationMessages.push({
          role: 'assistant',
          content: response.content
        });
        
        conversationMessages.push({
          role: 'user',
          content: 'Based on your research, please generate the final WCL component code now.'
        });
      } else {
        // Extract WCL code from text response
        const textBlock = response.content.find(block => block.type === 'text');
        if (textBlock && textBlock.type === 'text') {
          wcl_code = textBlock.text.trim();
          
          // If the response contains markdown code blocks, extract just the WCL
          const codeBlockMatch = wcl_code.match(/```(?:wcl)?\n?([\s\S]+?)\n?```/);
          if (codeBlockMatch) {
            wcl_code = codeBlockMatch[1].trim();
          }
        }
        break;
      }
    }

    return wcl_code;
  }
}
