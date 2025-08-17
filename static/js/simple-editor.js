console.log('simple-editor.js loaded');

class SimpleEditor {
  constructor() {
    console.log('SimpleEditor initialized');
    this.quill = null;
    this.initialize();
  }

  initialize() {
    try {
      // Get editor container
      const container = document.getElementById('editor');
      if (!container) {
        throw new Error('Editor container not found');
      }

      // Clear any existing content
      container.innerHTML = '';

      // Initialize Quill
      this.quill = new Quill(container, {
        theme: 'snow',
        modules: {
          toolbar: [
            ['bold', 'italic', 'underline'],
            [{ 'header': [1, 2, false] }],
            ['link', 'image']
          ]
        },
        placeholder: 'Type your content here...'
      });

      console.log('Quill editor initialized successfully');
      
      // Set up image handler
      this.setupImageHandler();
      
    } catch (error) {
      console.error('Failed to initialize editor:', error);
      this.showError(`Failed to initialize editor: ${error.message}`);
    }
  }

  setupImageHandler() {
    const toolbar = this.quill.getModule('toolbar');
    toolbar.addHandler('image', () => {
      this.handleImageSelect();
    });
  }

  handleImageSelect() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      // For now, just create a local URL for the image
      const url = URL.createObjectURL(file);
      const range = this.quill.getSelection();
      this.quill.insertEmbed(range.index, 'image', url);
      
      console.log('Image inserted:', file.name);
    };
    
    input.click();
  }

  showError(message) {
    console.error(message);
    
    const errorDiv = document.createElement('div');
    errorDiv.style.position = 'fixed';
    errorDiv.style.top = '10px';
    errorDiv.style.right = '10px';
    errorDiv.style.padding = '10px 15px';
    errorDiv.style.backgroundColor = '#ffebee';
    errorDiv.style.border = '1px solid #ef9a9a';
    errorDiv.style.borderRadius = '4px';
    errorDiv.style.color = '#c62828';
    errorDiv.style.zIndex = '10000';
    errorDiv.style.maxWidth = '400px';
    errorDiv.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    
    // Remove after 5 seconds
    setTimeout(() => {
      errorDiv.style.opacity = '0';
      setTimeout(() => errorDiv.remove(), 300);
    }, 5000);
  }
}

// Initialize editor when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM content loaded');
  window.editor = new SimpleEditor();
});
