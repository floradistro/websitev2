/**
 * Advanced Property Editor
 * Professional controls for component customization
 */

"use client";

import React, { useState } from 'react';
import { 
  Type, Layout, Palette, Move, Sparkles, 
  AlignLeft, AlignCenter, AlignRight,
  Bold, Italic, Underline, Link as LinkIcon
} from 'lucide-react';

interface AdvancedPropertyEditorProps {
  component: {
    id: string;
    component_key: string;
    props: Record<string, any>;
    container_config?: Record<string, any>;
  };
  onUpdate: (updates: any) => void;
}

export function AdvancedPropertyEditor({ component, onUpdate }: AdvancedPropertyEditorProps) {
  const [activeTab, setActiveTab] = useState<'content' | 'layout' | 'style' | 'advanced'>('content');

  const handlePropChange = (key: string, value: any) => {
    onUpdate({
      props: {
        ...component.props,
        [key]: value,
      },
    });
  };

  const handleContainerChange = (key: string, value: any) => {
    onUpdate({
      container_config: {
        ...(component.container_config || {}),
        [key]: value,
      },
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-neutral-700">
        {[
          { key: 'content' as const, label: 'Content', icon: Type },
          { key: 'layout' as const, label: 'Layout', icon: Layout },
          { key: 'style' as const, label: 'Style', icon: Palette },
          { key: 'advanced' as const, label: 'Advanced', icon: Sparkles },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 text-[10px] flex items-center justify-center gap-1 border-b-2 transition-all ${
              activeTab === tab.key
                ? 'border-blue-500 text-white bg-[#1e1e1e]'
                : 'border-transparent text-neutral-500 hover:text-white'
            }`}
          >
            <tab.icon size={10} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {activeTab === 'content' && (
          <>
            {/* Text Components */}
            {component.component_key === 'text' && (
              <>
                <div>
                  <label className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-1">Content</label>
                  <textarea
                    value={component.props.content || ''}
                    onChange={(e) => handlePropChange('content', e.target.value)}
                    className="w-full bg-[#1e1e1e] border border-neutral-700 rounded px-2 py-2 text-xs text-white resize-none"
                    rows={4}
                  />
                </div>

                <div>
                  <label className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-1">Variant</label>
                  <select
                    value={component.props.variant || 'paragraph'}
                    onChange={(e) => handlePropChange('variant', e.target.value)}
                    className="w-full bg-[#1e1e1e] border border-neutral-700 rounded px-2 py-1.5 text-xs text-white"
                  >
                    <option value="headline">Headline</option>
                    <option value="subheadline">Subheadline</option>
                    <option value="paragraph">Paragraph</option>
                    <option value="label">Label</option>
                    <option value="caption">Caption</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-1">Size</label>
                    <select
                      value={component.props.size || 'md'}
                      onChange={(e) => handlePropChange('size', e.target.value)}
                      className="w-full bg-[#1e1e1e] border border-neutral-700 rounded px-2 py-1.5 text-xs text-white"
                    >
                      <option value="xs">XS</option>
                      <option value="sm">SM</option>
                      <option value="md">MD</option>
                      <option value="lg">LG</option>
                      <option value="xl">XL</option>
                      <option value="2xl">2XL</option>
                      <option value="3xl">3XL</option>
                      <option value="4xl">4XL</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-1">Weight</label>
                    <select
                      value={component.props.fontWeight || 'normal'}
                      onChange={(e) => handlePropChange('fontWeight', e.target.value)}
                      className="w-full bg-[#1e1e1e] border border-neutral-700 rounded px-2 py-1.5 text-xs text-white"
                    >
                      <option value="light">Light</option>
                      <option value="normal">Normal</option>
                      <option value="medium">Medium</option>
                      <option value="semibold">Semibold</option>
                      <option value="bold">Bold</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-1">Alignment</label>
                  <div className="flex gap-1">
                    {[
                      { value: 'left', icon: AlignLeft },
                      { value: 'center', icon: AlignCenter },
                      { value: 'right', icon: AlignRight },
                    ].map(align => (
                      <button
                        key={align.value}
                        onClick={() => handlePropChange('align', align.value)}
                        className={`flex-1 p-2 rounded border transition-all ${
                          component.props.align === align.value
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-[#1e1e1e] border-neutral-700 text-neutral-400 hover:text-white'
                        }`}
                      >
                        <align.icon size={12} className="mx-auto" />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-1">Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={component.props.color || '#ffffff'}
                      onChange={(e) => handlePropChange('color', e.target.value)}
                      className="w-10 h-8 rounded border border-neutral-700 bg-[#1e1e1e]"
                    />
                    <input
                      type="text"
                      value={component.props.color || '#ffffff'}
                      onChange={(e) => handlePropChange('color', e.target.value)}
                      className="flex-1 bg-[#1e1e1e] border border-neutral-700 rounded px-2 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Button Components */}
            {component.component_key === 'button' && (
              <>
                <div>
                  <label className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-1">Text</label>
                  <input
                    type="text"
                    value={component.props.text || ''}
                    onChange={(e) => handlePropChange('text', e.target.value)}
                    className="w-full bg-[#1e1e1e] border border-neutral-700 rounded px-2 py-1.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-1">Link URL</label>
                  <div className="flex gap-1">
                    <LinkIcon size={12} className="text-neutral-600 mt-2" />
                    <input
                      type="text"
                      value={component.props.href || ''}
                      onChange={(e) => handlePropChange('href', e.target.value)}
                      placeholder="/shop"
                      className="flex-1 bg-[#1e1e1e] border border-neutral-700 rounded px-2 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-1">Variant</label>
                    <select
                      value={component.props.variant || 'primary'}
                      onChange={(e) => handlePropChange('variant', e.target.value)}
                      className="w-full bg-[#1e1e1e] border border-neutral-700 rounded px-2 py-1.5 text-xs text-white"
                    >
                      <option value="primary">Primary</option>
                      <option value="secondary">Secondary</option>
                      <option value="ghost">Ghost</option>
                      <option value="outline">Outline</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-1">Size</label>
                    <select
                      value={component.props.size || 'md'}
                      onChange={(e) => handlePropChange('size', e.target.value)}
                      className="w-full bg-[#1e1e1e] border border-neutral-700 rounded px-2 py-1.5 text-xs text-white"
                    >
                      <option value="sm">SM</option>
                      <option value="md">MD</option>
                      <option value="lg">LG</option>
                      <option value="xl">XL</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Generic for other components */}
            {!['text', 'button'].includes(component.component_key) && (
              <div className="text-[10px] text-neutral-600">
                <p>Component-specific controls will appear here</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'layout' && (
          <>
            <div>
              <label className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-1">Display</label>
              <select
                value={component.container_config?.display || 'block'}
                onChange={(e) => handleContainerChange('display', e.target.value)}
                className="w-full bg-[#1e1e1e] border border-neutral-700 rounded px-2 py-1.5 text-xs text-white"
              >
                <option value="block">Block</option>
                <option value="flex">Flex</option>
                <option value="grid">Grid</option>
                <option value="inline-block">Inline Block</option>
              </select>
            </div>

            {component.container_config?.display === 'flex' && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-1">Direction</label>
                    <select
                      value={component.container_config?.flexDirection || 'row'}
                      onChange={(e) => handleContainerChange('flexDirection', e.target.value)}
                      className="w-full bg-[#1e1e1e] border border-neutral-700 rounded px-2 py-1.5 text-xs text-white"
                    >
                      <option value="row">Row</option>
                      <option value="column">Column</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-1">Justify</label>
                    <select
                      value={component.container_config?.justifyContent || 'flex-start'}
                      onChange={(e) => handleContainerChange('justifyContent', e.target.value)}
                      className="w-full bg-[#1e1e1e] border border-neutral-700 rounded px-2 py-1.5 text-xs text-white"
                    >
                      <option value="flex-start">Start</option>
                      <option value="center">Center</option>
                      <option value="flex-end">End</option>
                      <option value="space-between">Space Between</option>
                      <option value="space-around">Space Around</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-1">Align Items</label>
                  <select
                    value={component.container_config?.alignItems || 'flex-start'}
                    onChange={(e) => handleContainerChange('alignItems', e.target.value)}
                    className="w-full bg-[#1e1e1e] border border-neutral-700 rounded px-2 py-1.5 text-xs text-white"
                  >
                    <option value="flex-start">Start</option>
                    <option value="center">Center</option>
                    <option value="flex-end">End</option>
                    <option value="stretch">Stretch</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-1">Gap</label>
                  <input
                    type="number"
                    value={component.container_config?.gap || 0}
                    onChange={(e) => handleContainerChange('gap', parseInt(e.target.value))}
                    className="w-full bg-[#1e1e1e] border border-neutral-700 rounded px-2 py-1.5 text-xs text-white"
                    min="0"
                    step="4"
                  />
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-1">Width</label>
                <input
                  type="text"
                  value={component.container_config?.width || 'auto'}
                  onChange={(e) => handleContainerChange('width', e.target.value)}
                  placeholder="auto, 100%, 500px"
                  className="w-full bg-[#1e1e1e] border border-neutral-700 rounded px-2 py-1.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-1">Height</label>
                <input
                  type="text"
                  value={component.container_config?.height || 'auto'}
                  onChange={(e) => handleContainerChange('height', e.target.value)}
                  placeholder="auto, 100%, 500px"
                  className="w-full bg-[#1e1e1e] border border-neutral-700 rounded px-2 py-1.5 text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-1">Padding</label>
              <div className="grid grid-cols-4 gap-1">
                {['top', 'right', 'bottom', 'left'].map(side => (
                  <input
                    key={side}
                    type="number"
                    value={component.container_config?.[`padding${side.charAt(0).toUpperCase() + side.slice(1)}`] || 0}
                    onChange={(e) => handleContainerChange(`padding${side.charAt(0).toUpperCase() + side.slice(1)}`, parseInt(e.target.value))}
                    placeholder={side[0].toUpperCase()}
                    className="w-full bg-[#1e1e1e] border border-neutral-700 rounded px-1 py-1 text-[10px] text-white text-center"
                    min="0"
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-1">Margin</label>
              <div className="grid grid-cols-4 gap-1">
                {['top', 'right', 'bottom', 'left'].map(side => (
                  <input
                    key={side}
                    type="number"
                    value={component.container_config?.[`margin${side.charAt(0).toUpperCase() + side.slice(1)}`] || 0}
                    onChange={(e) => handleContainerChange(`margin${side.charAt(0).toUpperCase() + side.slice(1)}`, parseInt(e.target.value))}
                    placeholder={side[0].toUpperCase()}
                    className="w-full bg-[#1e1e1e] border border-neutral-700 rounded px-1 py-1 text-[10px] text-white text-center"
                    min="0"
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'style' && (
          <>
            <div>
              <label className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-1">Background</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={component.container_config?.backgroundColor || '#000000'}
                  onChange={(e) => handleContainerChange('backgroundColor', e.target.value)}
                  className="w-10 h-8 rounded border border-neutral-700 bg-[#1e1e1e]"
                />
                <input
                  type="text"
                  value={component.container_config?.backgroundColor || 'transparent'}
                  onChange={(e) => handleContainerChange('backgroundColor', e.target.value)}
                  className="flex-1 bg-[#1e1e1e] border border-neutral-700 rounded px-2 py-1.5 text-xs text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-1">Border</label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  value={component.container_config?.borderWidth || 0}
                  onChange={(e) => handleContainerChange('borderWidth', parseInt(e.target.value))}
                  placeholder="Width"
                  className="w-full bg-[#1e1e1e] border border-neutral-700 rounded px-2 py-1.5 text-xs text-white"
                  min="0"
                />
                <select
                  value={component.container_config?.borderStyle || 'solid'}
                  onChange={(e) => handleContainerChange('borderStyle', e.target.value)}
                  className="w-full bg-[#1e1e1e] border border-neutral-700 rounded px-2 py-1.5 text-xs text-white"
                >
                  <option value="solid">Solid</option>
                  <option value="dashed">Dashed</option>
                  <option value="dotted">Dotted</option>
                </select>
                <input
                  type="color"
                  value={component.container_config?.borderColor || '#000000'}
                  onChange={(e) => handleContainerChange('borderColor', e.target.value)}
                  className="w-full h-8 rounded border border-neutral-700 bg-[#1e1e1e]"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-1">Border Radius</label>
              <input
                type="number"
                value={component.container_config?.borderRadius || 0}
                onChange={(e) => handleContainerChange('borderRadius', parseInt(e.target.value))}
                className="w-full bg-[#1e1e1e] border border-neutral-700 rounded px-2 py-1.5 text-xs text-white"
                min="0"
              />
            </div>

            <div>
              <label className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-1">Shadow</label>
              <select
                value={component.container_config?.boxShadow || 'none'}
                onChange={(e) => handleContainerChange('boxShadow', e.target.value)}
                className="w-full bg-[#1e1e1e] border border-neutral-700 rounded px-2 py-1.5 text-xs text-white"
              >
                <option value="none">None</option>
                <option value="0 1px 2px rgba(0,0,0,0.05)">XS</option>
                <option value="0 1px 3px rgba(0,0,0,0.1)">SM</option>
                <option value="0 4px 6px rgba(0,0,0,0.1)">MD</option>
                <option value="0 10px 15px rgba(0,0,0,0.1)">LG</option>
                <option value="0 20px 25px rgba(0,0,0,0.15)">XL</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-1">Opacity</label>
              <input
                type="range"
                value={component.container_config?.opacity || 1}
                onChange={(e) => handleContainerChange('opacity', parseFloat(e.target.value))}
                className="w-full"
                min="0"
                max="1"
                step="0.1"
              />
              <div className="text-[10px] text-neutral-500 text-center">{component.container_config?.opacity || 1}</div>
            </div>
          </>
        )}

        {activeTab === 'advanced' && (
          <>
            <div>
              <label className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-1">Animation</label>
              <select
                value={component.container_config?.animation || 'none'}
                onChange={(e) => handleContainerChange('animation', e.target.value)}
                className="w-full bg-[#1e1e1e] border border-neutral-700 rounded px-2 py-1.5 text-xs text-white"
              >
                <option value="none">None</option>
                <option value="fade-in">Fade In</option>
                <option value="slide-up">Slide Up</option>
                <option value="slide-down">Slide Down</option>
                <option value="zoom-in">Zoom In</option>
                <option value="bounce">Bounce</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-1">Transform</label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <input
                    type="number"
                    value={component.container_config?.rotate || 0}
                    onChange={(e) => handleContainerChange('rotate', parseInt(e.target.value))}
                    placeholder="Rotate"
                    className="w-full bg-[#1e1e1e] border border-neutral-700 rounded px-2 py-1.5 text-xs text-white"
                  />
                  <div className="text-[10px] text-neutral-600 text-center mt-0.5">Rotate</div>
                </div>
                <div>
                  <input
                    type="number"
                    value={component.container_config?.scaleX || 1}
                    onChange={(e) => handleContainerChange('scaleX', parseFloat(e.target.value))}
                    placeholder="Scale X"
                    step="0.1"
                    className="w-full bg-[#1e1e1e] border border-neutral-700 rounded px-2 py-1.5 text-xs text-white"
                  />
                  <div className="text-[10px] text-neutral-600 text-center mt-0.5">Scale X</div>
                </div>
                <div>
                  <input
                    type="number"
                    value={component.container_config?.scaleY || 1}
                    onChange={(e) => handleContainerChange('scaleY', parseFloat(e.target.value))}
                    placeholder="Scale Y"
                    step="0.1"
                    className="w-full bg-[#1e1e1e] border border-neutral-700 rounded px-2 py-1.5 text-xs text-white"
                  />
                  <div className="text-[10px] text-neutral-600 text-center mt-0.5">Scale Y</div>
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-1">Transition Duration</label>
              <input
                type="number"
                value={component.container_config?.transitionDuration || 300}
                onChange={(e) => handleContainerChange('transitionDuration', parseInt(e.target.value))}
                placeholder="ms"
                className="w-full bg-[#1e1e1e] border border-neutral-700 rounded px-2 py-1.5 text-xs text-white"
                min="0"
                step="50"
              />
            </div>

            <div>
              <label className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-1">Z-Index</label>
              <input
                type="number"
                value={component.container_config?.zIndex || 0}
                onChange={(e) => handleContainerChange('zIndex', parseInt(e.target.value))}
                className="w-full bg-[#1e1e1e] border border-neutral-700 rounded px-2 py-1.5 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-1">Overflow</label>
              <select
                value={component.container_config?.overflow || 'visible'}
                onChange={(e) => handleContainerChange('overflow', e.target.value)}
                className="w-full bg-[#1e1e1e] border border-neutral-700 rounded px-2 py-1.5 text-xs text-white"
              >
                <option value="visible">Visible</option>
                <option value="hidden">Hidden</option>
                <option value="scroll">Scroll</option>
                <option value="auto">Auto</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-1">Position</label>
              <select
                value={component.container_config?.position || 'relative'}
                onChange={(e) => handleContainerChange('position', e.target.value)}
                className="w-full bg-[#1e1e1e] border border-neutral-700 rounded px-2 py-1.5 text-xs text-white"
              >
                <option value="static">Static</option>
                <option value="relative">Relative</option>
                <option value="absolute">Absolute</option>
                <option value="fixed">Fixed</option>
                <option value="sticky">Sticky</option>
              </select>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

