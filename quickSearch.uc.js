(function() {
    'use strict';

    // --- Preference Configuration (following AI Tab Groups pattern) ---
    
    // Preference Keys
    const CONTEXT_MENU_ENABLED_PREF = "extensions.quicksearch.context_menu.enabled";
    const CONTEXT_MENU_ENGINE_PREF = "extensions.quicksearch.context_menu.engine";
    const CONTEXT_MENU_ACCESS_KEY_PREF = "extensions.quicksearch.context_menu.access_key";
    const CONTAINER_POSITION_PREF = "extensions.quicksearch.container.position";
    const CONTAINER_THEME_PREF = "extensions.quicksearch.container.theme";
    const BEHAVIOR_ANIMATION_ENABLED_PREF = "extensions.quicksearch.behavior.animation_enabled";
    const BEHAVIOR_REMEMBER_SIZE_PREF = "extensions.quicksearch.behavior.remember_size";
    const BEHAVIOR_AUTO_FOCUS_PREF = "extensions.quicksearch.behavior.auto_focus";
    const SHORTCUTS_TOGGLE_KEY_PREF = "extensions.quicksearch.shortcuts.toggle_key";
    const SHORTCUTS_ESCAPE_CLOSES_PREF = "extensions.quicksearch.shortcuts.escape_closes";

    // Helper function to read preferences with fallbacks (like AI Tab Groups)
    const getPref = (prefName, defaultValue = "") => {
        try {
            const prefService = Services.prefs;
            if (prefService.prefHasUserValue(prefName)) {
                switch (prefService.getPrefType(prefName)) {
                    case prefService.PREF_STRING:
                        return prefService.getStringPref(prefName);
                    case prefService.PREF_INT:
                        return prefService.getIntPref(prefName);
                    case prefService.PREF_BOOL:
                        return prefService.getBoolPref(prefName);
                }
            }
        } catch (e) {
            console.warn(`QuickSearch: Failed to read preference ${prefName}:`, e);
        }
        return defaultValue;
    };

    // Helper function to set preferences
    const setPref = (prefName, value) => {
        try {
            const prefService = Services.prefs;
            if (typeof value === 'boolean') {
                prefService.setBoolPref(prefName, value);
            } else if (typeof value === 'number') {
                prefService.setIntPref(prefName, value);
            } else {
                prefService.setStringPref(prefName, value);
            }
        } catch (e) {
            console.warn(`QuickSearch: Failed to set preference ${prefName}:`, e);
        }
    };

    // Read preference values once at startup (like AI Tab Groups)
    const CONTEXT_MENU_ENABLED = getPref(CONTEXT_MENU_ENABLED_PREF, true);
    const CONTEXT_MENU_ENGINE = getPref(CONTEXT_MENU_ENGINE_PREF, "@ddg");
    const CONTEXT_MENU_ACCESS_KEY = getPref(CONTEXT_MENU_ACCESS_KEY_PREF, "Q");
    const CONTAINER_POSITION = getPref(CONTAINER_POSITION_PREF, "top-right");
    const CONTAINER_THEME = getPref(CONTAINER_THEME_PREF, "dark");
    const BEHAVIOR_ANIMATION_ENABLED = getPref(BEHAVIOR_ANIMATION_ENABLED_PREF, true);
    const BEHAVIOR_REMEMBER_SIZE = getPref(BEHAVIOR_REMEMBER_SIZE_PREF, true);
    const BEHAVIOR_AUTO_FOCUS = getPref(BEHAVIOR_AUTO_FOCUS_PREF, true);
    const SHORTCUTS_TOGGLE_KEY = getPref(SHORTCUTS_TOGGLE_KEY_PREF, "Ctrl+Shift+Q");
    const SHORTCUTS_ESCAPE_CLOSES = getPref(SHORTCUTS_ESCAPE_CLOSES_PREF, true);

    // --- End Preference Configuration ---
    
    const googleFaviconAPI = (url) => {
        try {
            const hostName = new URL(url).hostname;
            return `https://s2.googleusercontent.com/s2/favicons?domain_url=https://${hostName}&sz=32`;
        } catch (e) {
            return undefined; // Return undefined for invalid URLs
        }
    };

    const getFaviconImg  =(engine)=>{ 
      const img = document.createElement('img');
      const thirdFallback = 'chrome://branding/content/icon32.png'
      engine.getIconURL().then(url=>{
        img.src = url || googleFaviconAPI(engine.getSubmission("test").uri.spec) || thirdFallback
      }).catch( 
        // fallback to google faviconAPI in case of error
        img.src = googleFaviconAPI(engine.getSubmission("test").uri.spec) || thirdFallback 
      )
      img.src ='chrome://browser/content/zen-images/grain-bg.png'
      img.alt = engine.name;
      return img
    }

    let currentSearchEngine = null;
    let currentSearchTerm = '';
    const updateSelectedEngine = () =>{
      if (!currentSearchEngine) return
      const img = getFaviconImg(currentSearchEngine)
      const quicksearchEngineButton = document.getElementById( 'quicksearch-engine-select' );
      if (quicksearchEngineButton){
        quicksearchEngineButton.innerHTML = '';
        quicksearchEngineButton.appendChild(img);
        quicksearchEngineButton.appendChild(document.createTextNode(currentSearchEngine.name));
      }
    }

    // Create and inject CSS for the search container
    const injectCSS = (theme = 'dark', position = 'top-right', animationsEnabled = true) => {
        // Theme configurations
        const themes = {
            dark: {
                containerBg: '#1e1f1f',
                containerBorder: '#404040',
                browserBg: '#2a2a2a',
                closeBtnBg: 'rgba(240, 240, 240, 0.8)',
                closeBtnColor: '#555',
                closeBtnHoverBg: 'rgba(220, 220, 220, 0.9)',
                closeBtnHoverColor: '#000',
                headerBg: '#2a2a2a',
                headerColor: '#e0e0e0'
            },
            light: {
                containerBg: '#ffffff',
                containerBorder: '#e0e0e0',
                browserBg: '#f9f9f9',
                closeBtnBg: 'rgba(60, 60, 60, 0.8)',
                closeBtnColor: '#fff',
                closeBtnHoverBg: 'rgba(40, 40, 40, 0.9)',
                closeBtnHoverColor: '#fff',
                headerBg: '#f0f0f0',
                headerColor: '#333'
            },
            auto: window.matchMedia('(prefers-color-scheme: dark)').matches ? {
                containerBg: '#1e1f1f',
                containerBorder: '#404040',
                browserBg: '#2a2a2a',
                closeBtnBg: 'rgba(240, 240, 240, 0.8)',
                closeBtnColor: '#555',
                closeBtnHoverBg: 'rgba(220, 220, 220, 0.9)',
                closeBtnHoverColor: '#000',
                headerBg: '#2a2a2a',
                headerColor: '#e0e0e0'
            } : {
                containerBg: '#ffffff',
                containerBorder: '#e0e0e0',
                browserBg: '#f9f9f9',
                closeBtnBg: 'rgba(60, 60, 60, 0.8)',
                closeBtnColor: '#fff',
                closeBtnHoverBg: 'rgba(40, 40, 40, 0.9)',
                closeBtnHoverColor: '#fff',
                headerBg: '#f0f0f0',
                headerColor: '#333'
            }
        };

        const currentTheme = themes[theme] || themes.dark;

        // Position configurations
        const positions = {
            'top-right': { top: '10px', right: '10px', left: 'auto', bottom: 'auto' },
            'top-left': { top: '10px', left: '10px', right: 'auto', bottom: 'auto' },
            'center': { top: '50%', left: '50%', right: 'auto', bottom: 'auto', transform: 'translate(-50%, -50%)' },
            'bottom-right': { bottom: '10px', right: '10px', top: 'auto', left: 'auto' },
            'bottom-left': { bottom: '10px', left: '10px', top: 'auto', right: 'auto' }
        };

        const currentPosition = positions[position] || positions['top-right'];

        const css = `
            @keyframes quicksearchSlideIn {
                0% {
                    transform: ${position === 'center' ? 'translate(-50%, -50%) scale(0.8)' : 'translateY(-100%)'};
                    opacity: 0;
                }
                60% {
                    transform: ${position === 'center' ? 'translate(-50%, -50%) scale(1.05)' : 'translateY(5%)'};
                    opacity: 1;
                }
                80% {
                    transform: ${position === 'center' ? 'translate(-50%, -50%) scale(0.98)' : 'translateY(-2%)'};
                }
                100% {
                    transform: ${position === 'center' ? 'translate(-50%, -50%) scale(1)' : 'translateY(0)'};
                }
            }
            
            @keyframes quicksearchSlideOut {
                0% {
                    transform: ${position === 'center' ? 'translate(-50%, -50%) scale(1)' : 'translateY(0)'};
                    opacity: 1;
                }
                100% {
                    transform: ${position === 'center' ? 'translate(-50%, -50%) scale(0.8)' : 'translateY(-100%)'};
                    opacity: 0;
                }
            }
            
            #quicksearch-container {
                position: fixed;
                top: ${currentPosition.top};
                right: ${currentPosition.right};
                left: ${currentPosition.left};
                bottom: ${currentPosition.bottom};
                ${currentPosition.transform ? `transform: ${currentPosition.transform};` : ''}
                width: 550px;
                min-width: 200px;
                height: 300px;
                min-height: 150px;
                max-width: 70vw;
                max-height: 70vh;
                background-color: ${currentTheme.containerBg};
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                z-index: 9999;
                display: none;
                flex-direction: column;
                overflow: hidden;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                opacity: 0;
                border: 1px solid ${currentTheme.containerBorder};
            }
            
            #quicksearch-container.visible {
                display: flex;
                opacity: 1;
                ${animationsEnabled ? 'animation: quicksearchSlideIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;' : ''}
            }
            
            #quicksearch-container.closing {
                ${animationsEnabled ? 'animation: quicksearchSlideOut 0.3s ease-in forwards;' : ''}
            }

            #quicksearch-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 6px 10px;
                background-color: ${currentTheme.headerBg};
                border-bottom: 1px solid ${currentTheme.containerBorder};
                color: ${currentTheme.headerColor};
                flex-shrink: 0;
                user-select: none;
                -moz-user-select: none;
                gap: 8px;
            }

            #quicksearch-header-title {
                font-weight: bold;
                font-size: 14px;
            }

            #quicksearch-input {
                flex-grow: 1;
                padding: 4px 8px;
                border: 1px solid ${currentTheme.containerBorder};
                outline: none;
                font-size: 14px;
                box-sizing: border-box;
                background-color: ${currentTheme.containerBg};
                color: ${currentTheme.headerColor};
                border-radius: 4px;
            }
            
            #quicksearch-browser-container {
                flex: 1;
                width: 100%;
                border: none;
                background-color: ${currentTheme.browserBg};
                position: relative;
                overflow: hidden;
            }
            
            #quicksearch-content-frame {
                width: 100%;
                height: 100%;
                border: none;
                overflow: hidden;
                background-color: white;
                transform-origin: 0 0;
                transform: scale(1);
            }
            
            .quicksearch-close-button {
                width: 24px;
                height: 24px;
                background-color: ${currentTheme.closeBtnBg};
                border: none;
                border-radius: 50%;
                font-size: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: ${currentTheme.closeBtnColor};
                cursor: pointer;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
                transition: background-color 0.2s, transform 0.2s;
                flex-shrink: 0;
            }
            
            .quicksearch-close-button:hover {
                background-color: ${currentTheme.closeBtnHoverBg};
                transform: scale(1.1);
                color: ${currentTheme.closeBtnHoverColor};
            }
            
            #quicksearch-resizer {
               position: absolute;
               bottom: 0;
               left: 0;
               width: 0;
               height: 0;
               background:transparent;
               border-style: solid;
               border-width: 0 16px 16px 0;
               border-color: transparent #fff transparent transparent;
               cursor: sw-resize;
               z-index: 10001;
               transform: rotate(180deg);
            }

            #quicksearch-engine-select-wrapper {
              position: relative;
              display: flex;
              align-items: center;
              font-size: 14px;
              flex-grow: 1;
              min-width: 0;
            }

            #quicksearch-engine-select {
              display: flex;
              align-items: center;
              gap: 8px;
              padding: 4px 8px;
              border-radius: 6px;
              cursor: pointer;
              background-color: transparent;
              color: ${currentTheme.headerColor};
              transition: background-color 0.2s;
              width: 100%;
              max-width:140px;
              text-align: left;
              overflow: hidden;
              white-space: nowrap;
              text-overflow: ellipsis;
            }

            #quicksearch-engine-select:hover {
                background-color: rgba(127, 127, 127, 0.15);
            }

            #quicksearch-engine-options {
              position: absolute;
              top: 110%;
              left: 0;
              min-width: 200px;
              width: 100%;
              max-width: 200px;
              background-color: ${currentTheme.containerBg};
              border: 1px solid ${currentTheme.containerBorder};
              border-radius: 5px;
              max-height: 200px;
              overflow-y: auto;
              z-index: 10002;
              display: none;
              color: ${currentTheme.headerColor};
            }
            
            .quicksearch-engine-option {
              padding: 6px 10px;
              display: flex;
              align-items: center;
              cursor: pointer;
              gap: 8px;
            }
            
            .quicksearch-engine-option:hover {
              background-color: ${currentTheme.browserBg};
            }
            
            #quicksearch-engine-options img,
            #quicksearch-engine-select img {
              width: 16px;
              height: 16px;
              flex-shrink: 0;
            }
        `;
        
        const styleElement = document.createElement('style');
        styleElement.id = 'quicksearch-styles';
        styleElement.textContent = css;
        document.head.appendChild(styleElement);
    };

    // Function to ensure Services are available
    function ensureServicesAvailable() {
        if (typeof Services === 'undefined' && typeof Components !== 'undefined') {
            try {
                Components.utils.import("resource://gre/modules/Services.jsm");
                return true;
            } catch (e) {
                return false;
            }
        }
        return typeof Services !== 'undefined';
    }

    // Function to load content in browser
    function loadContentInBrowser(browser, searchUrl) {
        try {
            try {
                const uri = Services.io.newURI(searchUrl);
                const principal = Services.scriptSecurityManager.getSystemPrincipal();
                browser.loadURI(uri, {triggeringPrincipal: principal});
            } catch (e) {
                browser.loadURI(searchUrl);
            }
            return true;
        } catch (e) {
            try {
                browser.setAttribute("src", searchUrl);
                return true;
            } catch (e) {
                return false;
            }
        }
    }

    // Function to style content in iframe
    function styleContentFrame(element) {
        if (!element) return;
        
        if (element.tagName.toLowerCase() === 'iframe') {
            element.addEventListener('load', function() {
                setTimeout(() => {
                    try {
                        if (element.contentDocument) {
                            const style = element.contentDocument.createElement('style');
                            style.textContent = `
                                body, html {
                                    overflow: hidden !important;
                                    height: 100% !important;
                                    width: 100% !important;
                                    margin: 0 !important;
                                    padding: 0 !important;
                                }
                                
                                * {
                                    scrollbar-width: none !important;
                                }
                                *::-webkit-scrollbar {
                                    display: none !important;
                                    width: 0 !important;
                                    height: 0 !important;
                                }
                                
                                body {
                                    visibility: visible !important;
                                    opacity: 1 !important;
                                    background-color: #1e1f1f !important;
                                    display: block !important;
                                }
                                
                                body > * {
                                    z-index: auto !important;
                                    position: relative !important;
                                }
                            `;
                            element.contentDocument.head.appendChild(style);
                        }
                    } catch (e) {
                        // Cross-origin restrictions might prevent this
                    }
                }, 500);
            });
        }
    }

    // Wait for browser to be fully initialized
    function init() {
        if (!ensureServicesAvailable()) return;
        
        // Inject CSS with user preferences
        injectCSS(CONTAINER_THEME, CONTAINER_POSITION, BEHAVIOR_ANIMATION_ENABLED);
        
        let urlbar = null;
        if (gBrowser && gBrowser.urlbar) {
            urlbar = gBrowser.urlbar;
        } else {
            urlbar = document.getElementById("urlbar") || document.querySelector("#urlbar");
        }
        
        if (urlbar) {
            attachEventListeners(urlbar);
        } else {
            setTimeout(init, 1000);
        }
        
        // Add context menu item if enabled
        if (CONTEXT_MENU_ENABLED) {
            addContextMenuItem();
        }

        // Add keyboard shortcut listener
        addKeyboardShortcuts();
    }
    
    // Attach event listeners to the URL bar
    function attachEventListeners(urlbar) {
        let currentQuery = '';
        
        // Input event to track typing
        urlbar.addEventListener("input", function(event) {
            if (event.target && typeof event.target.value === 'string') {
                currentQuery = event.target.value;
            }
        }, true);
        
        // Add keydown event listener for Ctrl+Enter
        urlbar.addEventListener("keydown", function(event) {
            if (event.ctrlKey && event.key === "Enter") {
                // Check if Shift is also pressed for Glance mode
                if (event.shiftKey) {
                    event.preventDefault();
                    event.stopPropagation();
                    
                    let query = '';
                    try {
                        if (typeof currentQuery === 'string' && currentQuery.length > 0) {
                            query = currentQuery.trim();
                        }
                    } catch (error) {
                        return;
                    }
                    
                    if (query) {
                        openInGlanceMode(query);
                    }
                    
                    return false;
                } else {
                    // Original Ctrl+Enter behavior
                    event.preventDefault();
                    event.stopPropagation();
                    
                    let query = '';
                    try {
                        if (typeof currentQuery === 'string' && currentQuery.length > 0) {
                            query = currentQuery.trim();
                        }
                    } catch (error) {
                        return;
                    }
                    
                    if (query) {
                        let engineName = document.getElementById("urlbar-search-mode-indicator-title").innerText.trim();
                        handleQuickSearch(query, engineName);
                    }
                    
                    return false;
                }
            }
        }, true);
        
        // Update the tooltip to include Glance mode information
        let urlbarTooltip = "Quick Search Normal: Type a query and press Ctrl+Enter\n" +
                            "Quick Search Glance: Type a query and press Ctrl+Shift+Enter\n" +
                            "Prefixes: ";

        Services.search.getEngines().then(engines => {
            engines.forEach(engine => {
                if (engine._definedAliases && engine._definedAliases.length > 0) {
                    urlbarTooltip += engine._definedAliases[0] + " (" + engine.name + "), ";
                }
            });
            urlbarTooltip = urlbarTooltip.slice(0, -2);
            try {
                urlbar.setAttribute("tooltip", urlbarTooltip);
                urlbar.setAttribute("title", urlbarTooltip);
            } catch (error) {
                // Non-critical if tooltip fails
            }
        });
    }

      async function getSearchURLFromInput(input) {
          let engineName = document.getElementById("urlbar-search-mode-indicator-title").innerText.trim();
          let engines = await Services.search.getEngines();
          let engine = engines.find(e => e.name === engineName);
          if (!engine) engine = await Services.search.getDefault();
          let searchTerm = input.trim();
          let submission = engine.getSubmission(searchTerm);
          return submission.uri.spec;
      }

    // Function to get search URL with a specific engine
    async function getSearchURLWithEngine(query, engineName) {
        let engines = await Services.search.getEngines();
        let engine = engines.find(e => e.name === engineName || (e._definedAliases && e._definedAliases.includes(engineName)));

        if (!engine) engine = currentSearchEngine || await Services.search.getDefault();
        currentSearchEngine = engine

        let searchTerm = query.trim();
        currentSearchTerm = searchTerm

        // Small delay before updating selected engine
        setTimeout(() => {
          updateSelectedEngine()
        }, 100);
        let submission = engine.getSubmission(searchTerm);
        return submission.uri.spec;
    }
    

    // Function to open a URL in Zen Browser's Glance mode
    function openInGlanceMode(query) {
        getSearchURLFromInput(query).then(searchUrl => {
            try {
                if (window.gZenGlanceManager) {
                    const browserRect = document.documentElement.getBoundingClientRect();
                    const centerX = browserRect.width / 2;
                    const centerY = browserRect.height / 2;

                    const data = {
                        url: searchUrl,
                        x: centerX,
                        y: centerY,
                        width: 10,
                        height: 10
                    };

                    window.gZenGlanceManager.openGlance(data);
                } else {
                    gBrowser.addTab(searchUrl, {
                        triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal()
                    });
                }
            } catch (error) {
                console.error("Error opening glance mode:", error);
                gBrowser.addTab(searchUrl, {
                    triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal()
                });
            }
        });
    }

    // Process the search query and show in in-browser container
    function handleQuickSearch(query, engineName = null) {
        ensureServicesAvailable();

        const searchPromise = getSearchURLWithEngine(query, engineName);

        searchPromise.then(searchUrl => {
            try {
                // Get or create the container
                const container = createSearchContainer();
                const browserContainer = document.getElementById('quicksearch-browser-container');

                // Clear any previous content
                while (browserContainer.firstChild) {
                    browserContainer.removeChild(browserContainer.firstChild);
                }

                // Make the container visible immediately
                container.classList.add('visible');

                // Close the URL bar using Zen Browser's approach
                closeUrlBar(document.getElementById("urlbar"));

                // Add ESC key listener for this container
                addEscKeyListener(container);

                // Try browser element first
                const browserElement = createBrowserElement();

                if (browserElement) {
                    browserElement.id = 'quicksearch-content-frame';
                    browserElement.style.width = '100%';
                    browserElement.style.height = '100%';
                    browserElement.style.border = 'none';
                    browserElement.style.background = '#1e1f1f';
                    browserElement.style.overflow = 'hidden';

                    browserContainer.appendChild(browserElement);

                    const success = loadContentInBrowser(browserElement, searchUrl);

                    if (success) {
                        styleContentFrame(browserElement);
                        return;
                    } else {
                        browserContainer.removeChild(browserElement);
                    }
                }

                // Create an iframe as fallback if browser element failed
                const iframe = document.createElement('iframe');
                iframe.id = 'quicksearch-content-frame';
                iframe.style.width = '100%';
                iframe.style.height = '100%';
                iframe.style.border = 'none';
                iframe.style.background = 'white';
                iframe.style.overflow = 'hidden';

                // Enhanced sandbox permissions for better rendering
                iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-top-navigation');
                iframe.setAttribute('scrolling', 'no');
                iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
                iframe.referrerPolicy = 'origin';

                // Remove the load event listener that adjusted dimensions
                // First append to container, then set source
                browserContainer.appendChild(iframe);

                // Small delay before setting source
                setTimeout(() => {
                    iframe.src = searchUrl;
                }, 100);

                // Apply content styling
                styleContentFrame(iframe);

            } catch (error) {
                // Last resort: open in a new tab/window
                try {
                    gBrowser.addTab(searchUrl, {
                        triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal()
                    });
                } catch (e) {
                    window.open(searchUrl, '_blank');
                }
            }
        });
    }

    function closeUrlBar(urlbar) {
        if (!urlbar) return;
        
        try {
            if (window.gZenUIManager && typeof window.gZenUIManager.handleUrlbarClose === 'function') {
                window.gZenUIManager.handleUrlbarClose(false, false);
                return;
            }
            
            // Reset selection
            urlbar.selectionStart = urlbar.selectionEnd = 0;
        } catch (e) {
        }
    }

    function addEscKeyListener(container) {
        if (container._escKeyListener) {
            document.removeEventListener('keydown', container._escKeyListener);
        }
        
        container._escKeyListener = function(event) {
            if (event.key === 'Escape') {
                const escapeCloses = SHORTCUTS_ESCAPE_CLOSES;
                if (escapeCloses) {
                    event.preventDefault();
                    event.stopPropagation();
                    closeQuickSearch(container);
                    document.removeEventListener('keydown', container._escKeyListener);
                }
            }
        };
        
        document.addEventListener('keydown', container._escKeyListener);
    }

    // Add keyboard shortcuts
    function addKeyboardShortcuts() {
        function handleGlobalShortcuts(event) {
            const toggleKey = SHORTCUTS_TOGGLE_KEY;
            
            // Parse the toggle key combination
            const keyParts = toggleKey.split('+').map(k => k.trim());
            const hasCtrl = keyParts.includes('Ctrl');
            const hasShift = keyParts.includes('Shift');
            const hasAlt = keyParts.includes('Alt');
            const mainKey = keyParts[keyParts.length - 1];
            
            // Check if the pressed key combination matches the toggle shortcut
            if (event.ctrlKey === hasCtrl && 
                event.shiftKey === hasShift && 
                event.altKey === hasAlt && 
                event.key.toLowerCase() === mainKey.toLowerCase()) {
                
                event.preventDefault();
                event.stopPropagation();
                
                // Toggle Quick Search
                const existingContainer = document.getElementById('quicksearch-container');
                if (existingContainer && existingContainer.classList.contains('visible')) {
                    closeQuickSearch(existingContainer);
                } else {
                    // Create a simple search interface
                    const container = createSearchContainer();
                    container.classList.add('visible');
                    
                    const header = document.getElementById('quicksearch-header');
                    const selectorWrapper = document.getElementById('quicksearch-engine-select-wrapper');
                    const closeButton = container.querySelector('.quicksearch-close-button');

                    // Create a search input if it doesn't exist
                    let searchInput = document.getElementById('quicksearch-input');
                    if (!searchInput && header && selectorWrapper && closeButton) {
                        searchInput = document.createElement('input');
                        searchInput.id = 'quicksearch-input';
                        searchInput.type = 'text';
                        searchInput.placeholder = 'Enter search query...';
                        
                        searchInput.addEventListener('keydown', function(e) {
                            if (e.key === 'Enter') {
                                const query = this.value.trim();
                                if (query) {
                                    // Remove the input, restore selector, and search
                                    selectorWrapper.hidden = false;
                                    this.remove();
                                    handleQuickSearch(query);
                                }
                            }
                        });

                        selectorWrapper.hidden = true;
                        header.insertBefore(searchInput, closeButton);
                    }
                    
                    // Auto-focus if enabled
                    const autoFocus = BEHAVIOR_AUTO_FOCUS;
                    if (autoFocus && searchInput) {
                        setTimeout(() => searchInput.focus(), 100);
                    }
                    
                    addEscKeyListener(container);
                }
            }
        }
        
        document.addEventListener('keydown', handleGlobalShortcuts, true);
    }

    // Function to close the quick search container
    function closeQuickSearch(container) {
        if (!container) container = document.getElementById('quicksearch-container');
        if (!container) return;
        
        const animationsEnabled = BEHAVIOR_ANIMATION_ENABLED;
        const animationDuration = animationsEnabled ? 300 : 0;
        
        if (animationsEnabled) {
            container.classList.add('closing');
        }
        
        setTimeout(() => {
            container.classList.remove('visible');
            container.classList.remove('closing');
            
            // Clear iframe source when closing
            const iframe = document.getElementById('quicksearch-content-frame');
            if (iframe) {
                try {
                    iframe.src = 'about:blank';
                } catch (err) {
                }
            }
            
            // Remove search input if exists
            const searchInput = document.getElementById('quicksearch-input');
            if (searchInput) {
                searchInput.remove();
            }

            // Ensure selector is visible again
            const selectorWrapper = document.getElementById('quicksearch-engine-select-wrapper');
            if (selectorWrapper) {
                selectorWrapper.hidden = false;
            }
            
            // Remove the ESC key listener
            if (container._escKeyListener) {
                document.removeEventListener('keydown', container._escKeyListener);
                container._escKeyListener = null;
            }
        }, animationDuration);
    }
    
        function saveContainerDimensions(width, height) {
        // Container dimensions are no longer saved - using fixed default size
        console.log('QuickSearch: Container dimensions not saved (width/height settings removed)');
    }

        function loadContainerDimensions() {
        // Use fixed default dimensions
        const width = 550;
        const height = 300;

        const container = document.getElementById('quicksearch-container');
        if (container) {
            container.style.width = `${width}px`;
            container.style.height = `${height}px`;
        }
    }

    // Create and initialize the search container
    function createSearchContainer() {
        let container = document.getElementById('quicksearch-container');
        if (container) {
            // loadContainerDimensions();
            return container;
        }
        
        // Create the container elements
        container = document.createElement('div');
        container.id = 'quicksearch-container';
        
        // Create header
        const header = document.createElement('div');
        header.id = 'quicksearch-header';

        const quicksearchEngineWrapper = document.createElement('div');
        quicksearchEngineWrapper.id = 'quicksearch-engine-select-wrapper';

        const quicksearchEngineButton = document.createElement('div');
        quicksearchEngineButton.id = 'quicksearch-engine-select';

        const quicksearchOptions = document.createElement('div');
        quicksearchOptions.id = 'quicksearch-engine-options';

        quicksearchEngineWrapper.appendChild(quicksearchEngineButton);
        quicksearchEngineWrapper.appendChild(quicksearchOptions);

        quicksearchEngineButton.addEventListener('click', (e) => {
          e.stopPropagation();  
          quicksearchOptions.style.display = quicksearchOptions.style.display === 'block' ? 'none' : 'block';
        });

        document.addEventListener('click', () => {
          quicksearchOptions.style.display = 'none';
        });

        Services.search.getEngines().then(engines => {
            quicksearchOptions.innerHTML = '';
            engines.forEach(engine => {
                const option = document.createElement('div');
                option.className = 'quicksearch-engine-option';

                const img = getFaviconImg(engine)
                option.appendChild(img);
                option.appendChild(document.createTextNode(engine.name));

                option.addEventListener('click', (e) => {
                  e.stopPropagation();
                  if (currentSearchEngine && currentSearchEngine.name == engine.name) return
                  currentSearchEngine = engine;
                  quicksearchOptions.style.display = 'none';
                  
                  if (currentSearchTerm) {
                    handleQuickSearch(currentSearchTerm, engine.name);
                  }
                });

                quicksearchOptions.appendChild(option);
            });

            return Services.search.getDefault();
        }).then(defaultEngine => {
            if (!currentSearchEngine) {
                currentSearchEngine = defaultEngine;
                const img = getFaviconImg(currentSearchEngine)
                quicksearchEngineButton.innerHTML = '';
                quicksearchEngineButton.appendChild(img);
                quicksearchEngineButton.appendChild(document.createTextNode(defaultEngine.name));
            }
        });

        const closeButton = document.createElement('button');
        closeButton.className = 'quicksearch-close-button';
        closeButton.innerHTML = '&#10005;'; // X symbol
        closeButton.title = 'Close';
        closeButton.onclick = (e) => {
            e.stopPropagation();
            closeQuickSearch(container);
        };

        header.appendChild(quicksearchEngineWrapper);
        header.appendChild(closeButton);

        // Container for the browser element
        const browserContainer = document.createElement('div');
        browserContainer.id = 'quicksearch-browser-container';
        browserContainer.style.flex = '1';
        browserContainer.style.width = '100%';
        browserContainer.style.position = 'relative';
        browserContainer.style.overflow = 'hidden';
        
        // Create resizer element
        const resizer = document.createElement('div');
        resizer.id = 'quicksearch-resizer';
        
        let isResizing = false;
        let startX, startY, startWidth, startHeight;
        
        resizer.addEventListener('mousedown', function(e) {
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            startWidth = container.offsetWidth;
            startHeight = container.offsetHeight;
            document.addEventListener('mousemove', doResize);
            document.addEventListener('mouseup', stopResize);
        });
        
        function doResize(e) {
            if (!isResizing) return;
            
            let width = startWidth - (e.clientX - startX);
            let height = startHeight - (startY - e.clientY);
            
            // Enforce minimum dimensions
            width = Math.max(width, 200);
            height = Math.max(height, 150);

            // Enforce maximum dimensions
            width = Math.min(width, window.innerWidth * 0.7);
            height = Math.min(height, window.innerHeight * 0.7);
            
            container.style.width = width + 'px';
            container.style.height = height + 'px';
        }
        
        function stopResize() {
            if (!isResizing) return;
            
            isResizing = false;
            document.removeEventListener('mousemove', doResize);
            document.removeEventListener('mouseup', stopResize);
            
            // Save the new dimensions
            saveContainerDimensions(container.offsetWidth, container.offsetHeight);
        }
        
        // Assemble the elements
        container.appendChild(header);
        container.appendChild(browserContainer);
        container.appendChild(resizer);
        
        document.body.appendChild(container);
        loadContainerDimensions();
        return container;
    }

    function createBrowserElement() {
        try {
            const browser = document.createXULElement("browser");
            
            browser.setAttribute("type", "content");
            browser.setAttribute("remote", "true");
            browser.setAttribute("maychangeremoteness", "true");
            browser.setAttribute("disablehistory", "true");
            browser.setAttribute("flex", "1");
            browser.setAttribute("noautohide", "true");
            
            return browser;
        } catch (e) {
            try {
                const browser = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "browser");
                
                browser.setAttribute("type", "content");
                browser.setAttribute("remote", "true");
                
                return browser;
            } catch (e) {
                return null;
            }
        }
    }

    // Function to add context menu item
    function addContextMenuItem() {
        const contextMenu = document.getElementById("contentAreaContextMenu");
        if (!contextMenu) {
            setTimeout(addContextMenuItem, 500);
            return;
        }

        if (document.getElementById("quicksearch-context-menuitem")) {
            return;
        }

        const accessKey = CONTEXT_MENU_ACCESS_KEY;
        const menuItem = document.createXULElement("menuitem");
        menuItem.id = "quicksearch-context-menuitem";
        menuItem.setAttribute("label", "Open in Quick Search");
        menuItem.setAttribute("accesskey", accessKey);
        
        menuItem.addEventListener("command", handleContextMenuClick);
        
        const searchSelectItem = contextMenu.querySelector("#context-searchselect");
        
        if (searchSelectItem) {
            // Insert right after the searchselect item
            if (searchSelectItem.nextSibling) {
                contextMenu.insertBefore(menuItem, searchSelectItem.nextSibling);
            } else {
                contextMenu.appendChild(menuItem);
            }
        } else {
            // Fallback: insert after context-sep-redo separator
            const redoSeparator = contextMenu.querySelector("#context-sep-redo");
            if (redoSeparator) {
                if (redoSeparator.nextSibling) {
                    contextMenu.insertBefore(menuItem, redoSeparator.nextSibling);
                } else {
                    contextMenu.appendChild(menuItem);
                }
            } else {
                // Final fallback: don't add the menu item if neither element is found
                return;
            }
        }

        contextMenu.addEventListener("popupshowing", updateContextMenuVisibility);
    }


    function handleContextMenuClick() {
        let selectedText = "";
        

        if (typeof gContextMenu !== 'undefined' && gContextMenu.selectedText) {
            selectedText = gContextMenu.selectedText.trim();
        } else {
            console.error("Error getting selected text:", e);
        }
        
        if (selectedText && selectedText.trim()) {
            handleQuickSearch(selectedText.trim(), CONTEXT_MENU_ENGINE);
        }
    }



    function updateContextMenuVisibility(event) {
        const menuItem = document.getElementById("quicksearch-context-menuitem");
        if (!menuItem) {
            return;
        }
        let hasSelection = false;
        let selectedText = "";

        if (typeof gContextMenu !== 'undefined') {
            hasSelection = gContextMenu.isTextSelected === true;
            if (hasSelection && gContextMenu.selectedText) {
                selectedText = gContextMenu.selectedText.trim();
            }
        }
        
        menuItem.hidden = !hasSelection;
    }

    setTimeout(init, 1000);
})();
