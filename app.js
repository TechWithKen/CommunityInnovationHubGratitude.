// CIHGRATITUDE - Main Application
class GratitudeExperience {
    constructor() {
        this.currentSlide = 0;
        this.revealIndex = 0;
        this.totalSlides = 9;
        this.isPresenterMode = false;
        this.isAccessibleView = false;
        this.slidesData = {};
        
        this.init();
    }
    
    init() {
        this.loadResponses();
        this.setupEventListeners();
        this.updateProgress();
        this.updateHint();
        this.setupPresenterNotes();
        
        // Initial save check
        setInterval(() => this.saveAllResponses(), 10000);
        
        // Word count for letter
        document.getElementById('gratitude-letter')?.addEventListener('input', (e) => {
            const wordCount = e.target.value.trim().split(/\s+/).filter(word => word.length > 0).length;
            document.getElementById('wordCount').textContent = wordCount;
        });
    }
    
    setupEventListeners() {
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            // Ignore if typing in textarea
            if (e.target.tagName === 'TEXTAREA') {
                return;
            }
            
            switch(e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.revealNext();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.revealPrevious();
                    break;
                case 'ArrowDown':
                case 'PageDown':
                    e.preventDefault();
                    this.nextSlide();
                    break;
                case 'ArrowUp':
                case 'PageUp':
                    e.preventDefault();
                    this.previousSlide();
                    break;
                case 'p':
                case 'P':
                    e.preventDefault();
                    this.togglePresenterMode();
                    break;
                case 'a':
                case 'A':
                    e.preventDefault();
                    this.toggleAccessibleView();
                    break;
                case '?':
                    e.preventDefault();
                    this.toggleControls();
                    break;
                case 'Escape':
                    document.querySelector('.controls-overlay')?.classList.remove('active');
                    break;
            }
        });
        
        // Touch/swipe support
        let touchStartX = 0;
        let touchStartY = 0;
        
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        });
        
        document.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].screenX;
            const touchEndY = e.changedTouches[0].screenY;
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            
            // Horizontal swipe for reveal
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (deltaX > 50) {
                    this.revealPrevious();
                } else if (deltaX < -50) {
                    this.revealNext();
                }
            } 
            // Vertical swipe for slide navigation
            else {
                if (deltaY > 50) {
                    this.previousSlide();
                } else if (deltaY < -50) {
                    this.nextSlide();
                }
            }
        });
        
        // Tap to advance (on mobile)
        document.addEventListener('click', (e) => {
            // Only if clicking on slide content (not buttons or inputs)
            if (e.target.closest('.slide-content') && 
                !e.target.closest('button') && 
                !e.target.closest('textarea') &&
                !e.target.closest('.cta-button')) {
                this.revealNext();
            }
        });
        
        // Control overlay buttons
        document.querySelector('.close-controls')?.addEventListener('click', () => {
            this.toggleControls();
        });
        
        document.querySelector('.close-notes')?.addEventListener('click', () => {
            this.togglePresenterMode();
        });
        
        // Save on input
        document.querySelectorAll('textarea').forEach(textarea => {
            textarea.addEventListener('input', () => {
                this.saveResponses();
            });
        });
        
        // Checkbox change
        document.getElementById('read-in-person')?.addEventListener('change', () => {
            this.saveResponses();
        });
    }
    
    getCurrentSlide() {
        return document.querySelector(`[data-slide="${this.currentSlide}"]`);
    }
    
    getStagedElements() {
        const slide = this.getCurrentSlide();
        return slide ? Array.from(slide.querySelectorAll('.staged')) : [];
    }
    
    revealNext() {
        const staged = this.getStagedElements();
        if (this.revealIndex < staged.length - 1) {
            staged[this.revealIndex].classList.remove('active');
            this.revealIndex++;
            staged[this.revealIndex].classList.add('active');
            this.updateHint();
            this.saveSlideState();
        }
    }
    
    revealPrevious() {
        const staged = this.getStagedElements();
        if (this.revealIndex > 0) {
            staged[this.revealIndex].classList.remove('active');
            this.revealIndex--;
            staged[this.revealIndex].classList.add('active');
            this.updateHint();
            this.saveSlideState();
        }
    }
    
    goToSlide(index) {
        if (index >= 0 && index < this.totalSlides) {
            // Hide current slide
            const current = this.getCurrentSlide();
            if (current) {
                current.classList.remove('active');
            }
            
            // Update indices
            this.currentSlide = index;
            this.revealIndex = 0;
            
            // Load slide state
            const slideData = this.slidesData[`slide${index}`] || {};
            this.revealIndex = slideData.revealIndex || 0;
            
            // Show new slide
            const nextSlide = this.getCurrentSlide();
            if (nextSlide) {
                nextSlide.classList.add('active');
                
                // Reset all staged elements to hidden
                const staged = this.getStagedElements();
                staged.forEach((element, idx) => {
                    element.classList.toggle('active', idx <= this.revealIndex);
                });
            }
            
            this.updateProgress();
            this.updateHint();
            this.updatePresenterNotes();
            
            // Scroll to top
            window.scrollTo(0, 0);
        }
    }
    
    nextSlide() {
        if (this.currentSlide < this.totalSlides - 1) {
            this.goToSlide(this.currentSlide + 1);
        }
    }
    
    previousSlide() {
        if (this.currentSlide > 0) {
            this.goToSlide(this.currentSlide - 1);
        }
    }
    
    updateProgress() {
        const progress = ((this.currentSlide + 1) / this.totalSlides) * 100;
        document.querySelector('.progress-bar').style.width = `${progress}%`;
        document.getElementById('current-slide').textContent = this.currentSlide + 1;
        document.getElementById('total-slides').textContent = this.totalSlides;
    }
    
    updateHint() {
        const hint = document.getElementById('hint');
        const staged = this.getStagedElements();
        
        if (staged.length === 0 || this.revealIndex >= staged.length - 1) {
            hint.innerHTML = '<span class="hint-arrow">↓</span><span class="hint-text">Press ↓ for next slide</span>';
        } else {
            hint.innerHTML = '<span class="hint-arrow">←</span><span class="hint-text">Press ← to continue</span>';
        }
    }
    
    togglePresenterMode() {
        this.isPresenterMode = !this.isPresenterMode;
        const notes = document.getElementById('presenterNotes');
        notes.classList.toggle('active', this.isPresenterMode);
        this.updatePresenterNotes();
    }
    
    updatePresenterNotes() {
        const notesContent = document.querySelector('.notes-content');
        const slideNotes = this.getPresenterNotes();
        notesContent.innerHTML = slideNotes;
    }
    
    getPresenterNotes() {
        const notes = {
            0: "Welcome students. Allow silence. Let them settle in. The abstract visual helps set a calm tone.",
            1: "Emphasize that gratitude isn't about ignoring difficulties. Pause after the reflection prompt.",
            2: "Scientific backing makes gratitude feel legitimate, not just 'feel-good'. Allow time for chapter title reflection.",
            3: "This slide needs ample time. Consider 2-3 minutes per prompt. Remind students their answers are private.",
            4: "Encourage specificity. 'They were nice' vs 'They stayed after class to explain functions when I was struggling'.",
            5: "The emotional peak. Soft background music optional. Allow 5-7 minutes for writing. Walk around to support.",
            6: "Create a safe space. Normalize emotion. No pressure to share, but encourage if ready.",
            7: "Transition from reflection to intention. This is about agency and hope.",
            8: "Close with warmth. Offer to print or email responses. Remind them growth is non-linear."
        };
        
        return notes[this.currentSlide] || "No notes for this slide.";
    }
    
    toggleAccessibleView() {
        this.isAccessibleView = !this.isAccessibleView;
        document.body.classList.toggle('accessible-view', this.isAccessibleView);
        
        // If turning on accessible view, reveal all staged elements
        if (this.isAccessibleView) {
            const staged = this.getStagedElements();
            staged.forEach((element, idx) => {
                element.classList.add('active');
            });
            this.revealIndex = staged.length - 1;
        } else {
            // Restore normal state
            const staged = this.getStagedElements();
            staged.forEach((element, idx) => {
                element.classList.toggle('active', idx <= this.revealIndex);
            });
        }
    }
    
    toggleControls() {
        document.querySelector('.controls-overlay').classList.toggle('active');
    }
    
    saveSlideState() {
        this.slidesData[`slide${this.currentSlide}`] = {
            revealIndex: this.revealIndex,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('gratitudeSlidesState', JSON.stringify(this.slidesData));
    }
    
    saveResponses() {
        const responses = {};
        
        // Collect all textarea values
        document.querySelectorAll('textarea').forEach(textarea => {
            responses[textarea.id] = textarea.value;
        });
        
        // Collect checkbox state
        const readCheckbox = document.getElementById('read-in-person');
        if (readCheckbox) {
            responses['readInPerson'] = readCheckbox.checked;
        }
        
        localStorage.setItem('gratitudeResponses', JSON.stringify(responses));
    }
    
    saveAllResponses() {
        this.saveResponses();
        this.saveSlideState();
        
        // Show subtle save confirmation
        this.showSaveConfirmation();
    }
    
    showSaveConfirmation() {
        const hint = document.getElementById('hint');
        const originalHTML = hint.innerHTML;
        
        hint.innerHTML = '<span class="hint-text" style="color: var(--color-success);">✓ Responses saved</span>';
        
        setTimeout(() => {
            hint.innerHTML = originalHTML;
        }, 2000);
    }
    
    loadResponses() {
        // Load slide states
        const savedSlides = localStorage.getItem('gratitudeSlidesState');
        if (savedSlides) {
            this.slidesData = JSON.parse(savedSlides);
        }
        
        // Load responses
        const savedResponses = localStorage.getItem('gratitudeResponses');
        if (savedResponses) {
            const responses = JSON.parse(savedResponses);
            
            // Populate textareas
            Object.entries(responses).forEach(([id, value]) => {
                if (id !== 'readInPerson') {
                    const element = document.getElementById(id);
                    if (element) {
                        element.value = value;
                        
                        // Update word count for letter
                        if (id === 'gratitude-letter') {
                            const wordCount = value.trim().split(/\s+/).filter(word => word.length > 0).length;
                            document.getElementById('wordCount').textContent = wordCount;
                        }
                    }
                }
            });
            
            // Restore checkbox
            if (responses.readInPerson !== undefined) {
                const checkbox = document.getElementById('read-in-person');
                if (checkbox) {
                    checkbox.checked = responses.readInPerson;
                }
            }
        }
    }
    
    resetAllResponses() {
        if (confirm('Are you sure you want to reset all your responses? This cannot be undone.')) {
            localStorage.removeItem('gratitudeResponses');
            localStorage.removeItem('gratitudeSlidesState');
            
            // Clear all textareas
            document.querySelectorAll('textarea').forEach(textarea => {
                textarea.value = '';
            });
            
            // Reset checkbox
            const checkbox = document.getElementById('read-in-person');
            if (checkbox) {
                checkbox.checked = false;
            }
            
            // Reset word count
            document.getElementById('wordCount').textContent = '0';
            
            // Reset slides
            this.slidesData = {};
            this.goToSlide(0);
            
            alert('All responses have been reset. The experience will restart.');
        }
    }
    
    setupPresenterNotes() {
        // Notes are already defined in getPresenterNotes()
        // Just ensure the notes container exists
        const notesContainer = document.querySelector('.notes-content');
        if (notesContainer) {
            this.updatePresenterNotes();
        }
    }
}

// Initialize the application
const gratitudeApp = new GratitudeExperience();

// Global functions for HTML onclick handlers
function nextSlide() {
    gratitudeApp.nextSlide();
}

function previousSlide() {
    gratitudeApp.previousSlide();
}

function togglePresenterMode() {
    gratitudeApp.togglePresenterMode();
}

function toggleAccessibleView() {
    gratitudeApp.toggleAccessibleView();
}

function toggleControls() {
    gratitudeApp.toggleControls();
}

function saveAllResponses() {
    gratitudeApp.saveAllResponses();
    
    // Show a more prominent confirmation
    const button = document.querySelector('.save-button');
    if (button) {
        const originalText = button.textContent;
        button.textContent = '✓ Saved Successfully!';
        button.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
        }, 3000);
    }
}

function resetAllResponses() {
    gratitudeApp.resetAllResponses();
}