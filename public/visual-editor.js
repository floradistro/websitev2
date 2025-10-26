/**
 * Visual Editor - Better Implementation
 * Adds interactive overlay to preview iframe
 */

function injectVisualEditor() {
  // Add styles
  const style = document.createElement('style');
  style.id = 'visual-editor-styles';
  style.textContent = `
    .visual-editor-active {
      position: relative;
    }
    
    .visual-editor-overlay {
      position: absolute;
      pointer-events: none;
      border: 2px solid rgba(59, 130, 246, 0.6);
      background: rgba(59, 130, 246, 0.1);
      border-radius: 4px;
      z-index: 9999;
      transition: all 0.15s ease;
    }
    
    .visual-editor-overlay.dragging {
      border-color: rgba(34, 197, 94, 0.8);
      background: rgba(34, 197, 94, 0.15);
    }
    
    .visual-editor-tools {
      position: absolute;
      top: -32px;
      right: 0;
      display: flex;
      gap: 4px;
      background: rgba(0, 0, 0, 0.9);
      padding: 4px 8px;
      border-radius: 6px;
      backdrop-filter: blur(8px);
      pointer-events: auto;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }
    
    .visual-editor-tool-btn {
      padding: 4px 8px;
      background: transparent;
      border: none;
      color: #a3a3a3;
      cursor: pointer;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
      transition: all 0.15s;
      white-space: nowrap;
    }
    
    .visual-editor-tool-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: white;
    }
    
    .visual-editor-label {
      position: absolute;
      top: -28px;
      left: 0;
      background: rgba(0, 0, 0, 0.9);
      color: #a3a3a3;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      pointer-events: none;
    }
    
    .visual-editor-section-outline {
      outline: 1px dashed rgba(168, 85, 247, 0.4) !important;
      outline-offset: 2px;
    }
    
    .visual-editor-section-outline:hover {
      outline: 2px dashed rgba(168, 85, 247, 0.6) !important;
    }
  `;
  document.head.appendChild(style);
  
  document.body.classList.add('visual-editor-active');
  
  let currentOverlay = null;
  let currentTarget = null;
  let selectedComponentId = null;
  
  // Listen for messages from parent editor
  window.addEventListener('message', function(event) {
    if (event.origin !== window.location.origin) return;
    
    if (event.data.type === 'HIGHLIGHT_COMPONENT') {
      const componentId = event.data.payload.componentId;
      selectedComponentId = componentId;
      
      // Find and highlight the component
      const element = document.querySelector(`[data-component-id="${componentId}"]`);
      if (element) {
        // Scroll into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Show overlay
        currentTarget = element;
        showOverlay(element);
        
        // Flash effect
        element.style.outline = '3px solid rgba(59, 130, 246, 1)';
        setTimeout(() => {
          element.style.outline = '';
        }, 1000);
      }
    }
    
    if (event.data.type === 'HIGHLIGHT_SECTION') {
      const sectionId = event.data.payload.sectionId;
      
      // Find and highlight the section
      const element = document.querySelector(`[data-section-id="${sectionId}"]`);
      if (element) {
        // Scroll into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Flash effect
        element.style.outline = '3px solid rgba(168, 85, 247, 1)';
        setTimeout(() => {
          element.style.outline = '';
        }, 1000);
      }
    }
  });
  
  // Track mouse movement
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('click', handleClick);
  
  function handleMouseMove(e) {
    const target = document.elementFromPoint(e.clientX, e.clientY);
    
    if (!target) {
      removeOverlay();
      return;
    }
    
    // Find component or section
    const component = target.closest('[data-component-id]');
    const section = target.closest('[data-section-id]');
    
    const element = component || section;
    
    if (!element || element === currentTarget) {
      return;
    }
    
    currentTarget = element;
    showOverlay(currentTarget);
  }
  
  function showOverlay(element) {
    removeOverlay();
    
    const rect = element.getBoundingClientRect();
    const componentId = element.getAttribute('data-component-id');
    const sectionId = element.getAttribute('data-section-id');
    const componentKey = element.getAttribute('data-component-key') || element.getAttribute('data-section-key') || 'element';
    
    const overlay = document.createElement('div');
    overlay.className = 'visual-editor-overlay';
    overlay.style.position = 'fixed';
    overlay.style.left = rect.left + 'px';
    overlay.style.top = rect.top + 'px';
    overlay.style.width = rect.width + 'px';
    overlay.style.height = rect.height + 'px';
    
    // Highlight selected component more prominently
    if (componentId === selectedComponentId) {
      overlay.style.border = '3px solid rgba(59, 130, 246, 1)';
      overlay.style.background = 'rgba(59, 130, 246, 0.2)';
    }
    
    // Add label
    const label = document.createElement('div');
    label.className = 'visual-editor-label';
    label.textContent = componentKey;
    overlay.appendChild(label);
    
    // Add tools
    const tools = document.createElement('div');
    tools.className = 'visual-editor-tools';
    
    if (componentId) {
      tools.innerHTML = `
        <button class="visual-editor-tool-btn" data-action="edit">✏️ Edit</button>
        <button class="visual-editor-tool-btn" data-action="move-up">↑</button>
        <button class="visual-editor-tool-btn" data-action="move-down">↓</button>
        <button class="visual-editor-tool-btn" data-action="delete">🗑️</button>
      `;
      
      tools.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const action = e.currentTarget.getAttribute('data-action');
          window.parent.postMessage({
            type: 'COMPONENT_ACTION',
            payload: { componentId, action }
          }, '*');
        });
      });
    } else if (sectionId) {
      tools.innerHTML = `
        <button class="visual-editor-tool-btn" data-action="edit">✏️ Edit Section</button>
        <button class="visual-editor-tool-btn" data-action="add">+ Add</button>
      `;
      
      tools.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const action = e.currentTarget.getAttribute('data-action');
          window.parent.postMessage({
            type: 'SECTION_ACTION',
            payload: { sectionId, action }
          }, '*');
        });
      });
    }
    
    overlay.appendChild(tools);
    document.body.appendChild(overlay);
    currentOverlay = overlay;
  }
  
  function removeOverlay() {
    if (currentOverlay) {
      currentOverlay.remove();
      currentOverlay = null;
      currentTarget = null;
    }
  }
  
  function handleClick(e) {
    if (e.target.closest('.visual-editor-overlay')) {
      return;
    }
    
    const component = e.target.closest('[data-component-id]');
    const section = e.target.closest('[data-section-id]');
    
    if (component) {
      const componentId = component.getAttribute('data-component-id');
      window.parent.postMessage({
        type: 'COMPONENT_SELECTED',
        payload: { componentId }
      }, '*');
      e.preventDefault();
      e.stopPropagation();
    } else if (section) {
      const sectionId = section.getAttribute('data-section-id');
      window.parent.postMessage({
        type: 'SECTION_SELECTED',
        payload: { sectionId }
      }, '*');
      e.preventDefault();
      e.stopPropagation();
    }
  }
  
  // Clean up on unload
  window.addEventListener('beforeunload', () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('click', handleClick);
    removeOverlay();
  });
  
  console.log('✅ Visual Editor Loaded');
}

// Auto-inject if in iframe with editor mode
if (window !== window.parent && window.location.search.includes('editor=true')) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectVisualEditor);
  } else {
    injectVisualEditor();
  }
}

