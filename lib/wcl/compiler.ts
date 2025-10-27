/**
 * WCL (WhaleTools Component Language) Compiler - Production Version V2
 * Transform WCL syntax into React/TypeScript components with comprehensive error handling
 * NOW USING: Parser V2 (Tokenizer + Recursive Descent Parser)
 */

import { parseWCL, validateWCL, type AST, type ComponentNode, type WCLParseError } from './parser-v2';

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
   * Parse WCL syntax into AST using Parser V2
   * Now handles: nested braces, comments, complex JSX, multi-line strings
   */
  parse(wclCode: string): WCLComponent {
    try {
      // Use new parser V2
      const ast = parseWCL(wclCode);
      
      // Convert AST to WCLComponent format
      return this.astToComponent(ast.component);
      
    } catch (error: any) {
      // Convert parser errors to compiler errors
      if (error.line && error.column) {
        throw new WCLCompilerError(
          error.message,
          error.line,
          error.column,
          error.suggestion,
          error.token?.value
        );
      }
      
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
   * Convert Parser V2 AST to WCLComponent format
   */
  private astToComponent(node: ComponentNode): WCLComponent {
    return {
      name: node.name,
      props: node.props ? this.convertProps(node.props) : {},
      data: node.data ? this.convertData(node.data) : {},
      render: this.convertRender(node.render)
    };
  }

  /**
   * Convert props AST node to legacy format
   */
  private convertProps(propsNode: any): Record<string, any> {
    const props: Record<string, any> = {};
    propsNode.properties.forEach((prop: any) => {
      props[prop.name] = {
        type: prop.propType,
        default: prop.defaultValue,
        optional: prop.optional
      };
    });
    return props;
  }

  /**
   * Convert data AST node to legacy format
   */
  private convertData(dataNode: any): Record<string, any> {
    const data: Record<string, any> = {};
    dataNode.fetchers.forEach((fetcher: any) => {
      data[fetcher.name] = {
        endpoint: fetcher.endpoint,
        directive: fetcher.cache ? 'cache' : undefined,
        params: fetcher.cache
      };
    });
    return data;
  }

  /**
   * Convert render AST node to legacy format
   */
  private convertRender(renderNode: any): string | QuantumRender {
    if (renderNode.mode === 'simple') {
      return renderNode.content?.raw || '';
    }
    
    // Quantum render
    return {
      quantum: renderNode.quantumStates?.map((state: any) => ({
        state: state.name,
        condition: state.condition,
        template: state.template.raw
      })) || []
    };
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
