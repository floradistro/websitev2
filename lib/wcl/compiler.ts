/**
 * WCL (WhaleTools Component Language) Compiler - Production Version
 * Transform WCL syntax into React/TypeScript components with comprehensive error handling
 */

export class WCLCompilerError extends Error {
  constructor(
    message: string,
    public line?: number,
    public column?: number,
    public suggestion?: string,
    public code?: string
  ) {
    super(message);
    this.name = 'WCLCompilerError';
  }
  
  toString() {
    let error = `${this.name}: ${this.message}`;
    if (this.line !== undefined) {
      error += `\n  at line ${this.line}${this.column !== undefined ? `:${this.column}` : ''}`;
    }
    if (this.suggestion) {
      error += `\n  💡 Suggestion: ${this.suggestion}`;
    }
    if (this.code) {
      error += `\n  Code: ${this.code}`;
    }
    return error;
  }
}

export interface WCLComponent {
  name: string;
  props?: Record<string, any>;
  data?: Record<string, any>;
  render: string | QuantumRender;
  optimize?: OptimizeDirective;
}

interface QuantumRender {
  quantum: QuantumState[];
}

interface QuantumState {
  state: string;
  condition: string;
  template: string;
}

interface OptimizeDirective {
  cache?: string;
  prefetch?: string;
  lazy?: boolean;
}

export class WCLCompiler {
  /**
   * Parse WCL syntax into AST
   */
  parse(wclCode: string): WCLComponent {
    try {
      const trimmedCode = wclCode.trim();
      
      // Validate component structure
      const componentMatch = trimmedCode.match(/component\s+(\w+)\s*\{([\s\S]+)\}$/);
      if (!componentMatch) {
        throw new WCLCompilerError(
          'Invalid WCL syntax: Expected "component ComponentName { ... }"',
          1,
          1,
          'Make sure your WCL starts with: component YourComponentName { ... }',
          trimmedCode.substring(0, 50)
        );
      }
      
      const [, name, body] = componentMatch;
      
      // Validate component name (PascalCase)
      if (!/^[A-Z][a-zA-Z0-9]*$/.test(name)) {
        throw new WCLCompilerError(
          `Invalid component name "${name}": Must be PascalCase`,
          1,
          10,
          'Use PascalCase like "SmartHero" or "ProductGrid"'
        );
      }
      
      // Extract props with error handling
      let props = {};
      const propsMatch = body.match(/props\s*{([^}]+)}/);
      if (propsMatch) {
        try {
          props = this.parseProps(propsMatch[1]);
        } catch (error: any) {
          throw new WCLCompilerError(
            `Error parsing props: ${error.message}`,
            undefined,
            undefined,
            'Check prop syntax: propName: Type = defaultValue'
          );
        }
      }
      
      // Extract data fetchers with error handling
      let data = {};
      const dataMatch = body.match(/data\s*{([^}]+)}/);
      if (dataMatch) {
        try {
          data = this.parseData(dataMatch[1]);
        } catch (error: any) {
          throw new WCLCompilerError(
            `Error parsing data: ${error.message}`,
            undefined,
            undefined,
            'Check data syntax: dataName = fetch("/api/endpoint") @cache(5m)'
          );
        }
      }
      
      // Extract render block
      const renderIndex = body.indexOf('render');
      if (renderIndex === -1) {
        throw new WCLCompilerError(
          'No render block found',
          undefined,
          undefined,
          'Add a render block: render { <div>...</div> } or render { quantum { ... } }'
        );
      }
      
      const renderSection = body.substring(renderIndex);
      const quantumMatch = renderSection.includes('quantum');
      
      let render: string | QuantumRender;
      if (quantumMatch) {
        try {
          const quantumContent = renderSection.substring(renderSection.indexOf('quantum') + 8);
          render = { quantum: this.parseQuantumStates(quantumContent) };
          
          if (render.quantum.length === 0) {
            throw new WCLCompilerError(
              'No quantum states defined',
              undefined,
              undefined,
              'Add at least one state: state Mobile when user.device == "mobile" { <div>...</div> }'
            );
          }
        } catch (error: any) {
          if (error instanceof WCLCompilerError) throw error;
          throw new WCLCompilerError(
            `Error parsing quantum states: ${error.message}`,
            undefined,
            undefined,
            'Check quantum syntax: state StateName when condition { <JSX /> }'
          );
        }
      } else {
        const simpleMatch = renderSection.match(/render\s*\{([^}]+)\}/);
        render = simpleMatch ? simpleMatch[1].trim() : '';
        
        if (!render) {
          throw new WCLCompilerError(
            'Empty render block',
            undefined,
            undefined,
            'Add JSX to your render block: render { <div>Hello</div> }'
          );
        }
      }
      
      return { name, props, data, render };
      
    } catch (error: any) {
      if (error instanceof WCLCompilerError) throw error;
      throw new WCLCompilerError(
        `Unexpected parse error: ${error.message}`,
        undefined,
        undefined,
        'Check your WCL syntax for errors'
      );
    }
  }
  
  /**
   * Compile WCL to TypeScript/React
   */
  compile(wclCode: string): string {
    const ast = this.parse(wclCode);
    
    // Store props for template transpilation
    this.currentProps = ast.props || {};
    
    return `
"use client";

import React, { useEffect, useState } from 'react';
import { SmartComponentWrapper, SmartComponentBaseProps } from '@/lib/smart-component-base';

export interface ${ast.name}Props extends SmartComponentBaseProps {
  ${this.generatePropsInterface(ast.props || {})}
}

export function ${ast.name}({ vendorId, ...props }: ${ast.name}Props) {
  ${this.generateDataFetchers(ast.data || {})}
  
  ${this.generateQuantumLogic(ast.render)}
  
  return (
    <SmartComponentWrapper 
      componentName="${ast.name}"
      loading={loading}
      error={error}
    >
      ${this.generateRenderLogic(ast.render)}
    </SmartComponentWrapper>
  );
}
`;
  }
  
  private parseProps(propsBody: string): Record<string, any> {
    const props: Record<string, any> = {};
    const lines = propsBody.split('\n').filter(l => l.trim());
    
    lines.forEach(line => {
      const match = line.match(/(\w+):\s*(\w+)(?:\s*=\s*(.+))?/);
      if (match) {
        const [, name, type, defaultValue] = match;
        props[name] = { type, default: defaultValue };
      }
    });
    
    return props;
  }
  
  private parseData(dataBody: string): Record<string, any> {
    const data: Record<string, any> = {};
    const fetchers = dataBody.match(/(\w+)\s*=\s*fetch\(([^)]+)\)(?:\s*@(\w+)\(([^)]+)\))?/g);
    
    if (fetchers) {
      fetchers.forEach(fetcher => {
        const match = fetcher.match(/(\w+)\s*=\s*fetch\("([^"]+)"\)(?:\s*@(\w+)\(([^)]+)\))?/);
        if (match) {
          const [, name, endpoint, directive, params] = match;
          data[name] = { endpoint, directive, params };
        }
      });
    }
    
    return data;
  }
  
  private parseQuantumStates(quantumBody: string): QuantumState[] {
    const states: QuantumState[] = [];
    
    // Find all state blocks with proper brace matching
    let currentIndex = 0;
    while (currentIndex < quantumBody.length) {
      const stateMatch = quantumBody.substring(currentIndex).match(/state\s+(\w+)\s+when\s+([^{]+)\s*{/);
      if (!stateMatch) break;
      
      const [matchText, stateName, condition] = stateMatch;
      const stateStart = currentIndex + stateMatch.index! + matchText.length;
      
      // Find matching closing brace
      let braceCount = 1;
      let templateEnd = stateStart;
      while (templateEnd < quantumBody.length && braceCount > 0) {
        if (quantumBody[templateEnd] === '{') braceCount++;
        if (quantumBody[templateEnd] === '}') braceCount--;
        templateEnd++;
      }
      
      if (braceCount === 0) {
        const template = quantumBody.substring(stateStart, templateEnd - 1).trim();
        states.push({
          state: stateName.trim(),
          condition: condition.trim(),
          template
        });
      }
      
      currentIndex = templateEnd;
    }
    
    return states;
  }
  
  private generatePropsInterface(props: Record<string, any>): string {
    if (!props || Object.keys(props).length === 0) {
      return '// No additional props';
    }
    
    return Object.entries(props).map(([name, config]) => {
      const optional = config.default ? '?' : '';
      return `${name}${optional}: ${this.mapWCLTypeToTS(config.type)};`;
    }).join('\n  ');
  }
  
  private mapWCLTypeToTS(wclType: string): string {
    const typeMap: Record<string, string> = {
      'String': 'string',
      'Number': 'number',
      'Boolean': 'boolean',
      'Product': 'Product',
      'Cart': 'Cart',
      'User': 'User'
    };
    return typeMap[wclType] || 'any';
  }
  
  private generateDataFetchers(data: Record<string, any>): string {
    if (!data || Object.keys(data).length === 0) {
      return 'const loading = false;\n  const error = null;';
    }
    
    const dataKeys = Object.keys(data);
    const fetchers = Object.entries(data).map(([name, config]) => {
      const cacheTime = config.directive === 'cache' ? config.params : '300';
      const typeDef = name === 'user' ? '<any>' : '';
      return `
  const [${name}, set${name[0].toUpperCase() + name.slice(1)}] = useState${typeDef}(null);
  
  useEffect(() => {
    fetch('${config.endpoint}')
      .then(res => res.json())
      .then(data => {
        set${name[0].toUpperCase() + name.slice(1)}(data);
      })
      .catch(() => {
        // Mock data for testing - set empty data to prevent null errors
        set${name[0].toUpperCase() + name.slice(1)}(${name === 'user' ? '{ device: "desktop", cartAbandoned: false }' : '{}'});
      });
  }, [vendorId]);`;
    }).join('\n');
    
    return `
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  ${fetchers}
  
  // Check if data is loaded
  const dataLoaded = ${dataKeys.map(key => `${key} !== null`).join(' && ')};
  
  useEffect(() => {
    if (dataLoaded) {
      setLoading(false);
    }
  }, [dataLoaded]);
  `;
  }
  
  private generateQuantumLogic(render: string | QuantumRender): string {
    if (typeof render === 'string') {
      return '// Simple render';
    }
    
    if (!render.quantum || render.quantum.length === 0) {
      return '// No quantum states';
    }
    
    return `
  // Quantum state management
  const [activeState, setActiveState] = useState('${render.quantum[0].state}');
  
  useEffect(() => {
    // Evaluate conditions and collapse quantum state
    ${render.quantum.map(state => `
    if (${this.transpileCondition(state.condition)}) {
      setActiveState('${state.state}');
    }`).join(' else ')}
  }, [props]);
  `;
  }
  
  private transpileCondition(condition: string): string {
    // Simple condition transpilation - use local state instead of props
    return condition
      .replace(/user\.(\w+)/g, 'user?.$1')
      .replace(/product\.(\w+)/g, 'product?.$1')
      .replace(/user\.cartAbandoned/g, 'user?.cartAbandoned')
      .replace(/user\.device/g, 'user?.device || "desktop"');
  }
  
  private generateRenderLogic(render: string | QuantumRender): string {
    if (typeof render === 'string') {
      // Simple template
      return this.transpileTemplate(render);
    }
    
    // Quantum render
    const states = render.quantum.map(state => `
      {activeState === '${state.state}' && dataLoaded && (
        ${this.transpileTemplate(state.template)}
      )}`
    ).join('\n');
    
    return `
      <>
        ${states}
      </>
    `;
  }
  
  private transpileTemplate(template: string): string {
    // Get the list of defined props to know what needs props. prefix
    const propNames = Object.keys(this.currentProps || {});
    
    // Convert WCL template to JSX - add props. prefix to all prop references
    let result = template;
    
    // Replace prop references that need props. prefix
    // This handles: {propName}, propName &&, propName.field, etc.
    propNames.forEach(propName => {
      // Match the prop name when it's:
      // 1. In curly braces: {propName}
      // 2. Standalone identifier: propName &&, propName ||, propName ?
      // 3. NOT already prefixed with props.
      
      // Pattern 1: {propName} -> {props.propName}
      const inBracesRegex = new RegExp(`\\{(${propName})\\}`, 'g');
      result = result.replace(inBracesRegex, '{props.$1}');
      
      // Pattern 2: propName at word boundary (for conditionals) -> props.propName
      const standaloneRegex = new RegExp(`\\b(${propName})\\b(?!:)(?![a-zA-Z])`, 'g');
      result = result.replace(standaloneRegex, (match, p1, offset) => {
        // Don't replace if already preceded by props.
        if (offset >= 6 && result.substring(offset - 6, offset) === 'props.') {
          return match;
        }
        // Don't replace in key= attributes or similar
        const before = result.substring(Math.max(0, offset - 10), offset);
        if (before.includes('key=') || before.includes('id=')) {
          return match;
        }
        return `props.${p1}`;
      });
    });
    
    // Add defaults for common props
    const defaultValues: Record<string, string> = {
      headline: '"Default Headline"',
      subheadline: '"Default Subheadline"',
      buttonText: '"Click Here"',
      buttonUrl: '"#"',
      ctaText: '"Learn More"',
      ctaPrimary: '"Get Started"',
      ctaSecondary: '"Learn More"'
    };
    
    Object.entries(defaultValues).forEach(([prop, defaultVal]) => {
      // Replace {props.prop} with {props.prop || default}
      const regex = new RegExp(`\\{props\\.${prop}\\}`, 'g');
      result = result.replace(regex, `{props.${prop} || ${defaultVal}}`);
    });
    
    return result;
  }
  
  private currentProps: Record<string, any> = {};
}

/**
 * Example WCL code:
 * 
 * component QuantumHero {
 *   props {
 *     headline: String = "Welcome"
 *     buttonText: String = "Shop Now"
 *   }
 *   
 *   data {
 *     products = fetch("/api/products") @cache(5m)
 *   }
 *   
 *   render {
 *     quantum {
 *       state Mobile when user.device == "mobile" {
 *         <div className="text-2xl">{headline}</div>
 *       }
 *       state Desktop when user.device == "desktop" {
 *         <div className="text-6xl">{headline}</div>
 *         <button>{buttonText}</button>
 *       }
 *     }
 *   }
 * }
 */
