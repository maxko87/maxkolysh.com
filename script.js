document.addEventListener('DOMContentLoaded', () => {
    const trigger = document.getElementById('animation-trigger');
    
    trigger.addEventListener('click', () => {
        const links = document.getElementsByTagName('a');
        
        Array.from(links).forEach((link, index) => {
            // Remove animation class if it exists
            link.classList.remove('swing-animation');
            
            // Force reflow
            void link.offsetWidth;
            
            // First link falls immediately, rest spread over 1.5 seconds
            const delay = index === 0 ? 0 : Math.random() * 1.5;
            link.style.animationDelay = `${delay}s`;
            
            // Add animation class
            link.classList.add('swing-animation');
        });
    });
}); 