// src/routes/routesTree.js
const express = require('express');
const router = express.Router();

// /routes-tree route
router.get('/', (req, res) => {
  const routesByModule = {};

  function getRoutes(stack, parentPath = '', parentModule = '', parentHasAuth = false, parentRouter = null) {
    stack.forEach(layer => {
      if (layer.route && layer.route.path) {
        const fullPath = (parentPath + layer.route.path).replace(/\/+/g, '/');
        const methods = Object.keys(layer.route.methods).map(m => m.toUpperCase());
        const moduleName = layer.handle?.moduleName || parentModule || fullPath.split('/')[1] || 'General';

        // Check for auth at route level OR inherited from parent router
        const routeHasAuth = layer.route.stack.some(l => l.name === 'verifyToken' || l.name === 'auth');
        const auth = (routeHasAuth || parentHasAuth) ? 'Protected' : 'Public';

        if (!routesByModule[moduleName]) routesByModule[moduleName] = [];

        const routeFields = layer.route.stack
          .map(l => l.handle?.fields)
          .filter(Boolean)[0];

        // Try to find route metadata from parent router's routesMeta
        let routeMeta = null;
        if (parentRouter && parentRouter.routesMeta) {
          routeMeta = parentRouter.routesMeta.find(meta =>
            meta.path === layer.route.path &&
            meta.method.toUpperCase() === methods[0]
          );
        }

        routesByModule[moduleName].push({
          path: fullPath,
          methods,
          auth,
          fields: routeFields || null,
          description: routeMeta?.description || null,
          sampleRequest: routeMeta?.sampleRequest || routeMeta?.request || null,
          sampleResponse: routeMeta?.sampleResponse || null,
          queryParams: routeMeta?.queryParams || null,
          database: routeMeta?.database || null,
          calculation: routeMeta?.calculation || null,
          actions: routeMeta?.actions || null,
          examples: routeMeta?.examples || null,
        });

      } else if (layer.name === 'router' && layer.handle.stack) {
        // Extract clean path from regex
        let newPath = '';
        if (layer.regexp) {
          const regexSource = layer.regexp.source;
          // Clean up the regex pattern to get a readable path
          newPath = regexSource
            .replace(/^\^\\\//, '/')              // Remove ^\/ at start
            .replace(/\\\//g, '/')                // Replace \/ with /
            .replace(/\\/g, '')                   // Remove remaining backslashes
            .replace(/\?\(\?=/g, '')              // Remove (?= lookahead start
            .replace(/\|?\$\)/g, '')              // Remove |$) lookahead end
            .replace(/\$$/g, '')                  // Remove $ at end
            .replace(/\^/g, '')                   // Remove ^ anchors
            .replace(/\/+/g, '/');                // Normalize multiple slashes
        }
        const moduleName = layer.handle?.moduleName || parentModule || '';

        // Check if this router has verifyToken middleware
        const routerHasAuth = layer.handle.stack.some(l =>
          l.name === 'verifyToken' || l.name === 'auth' ||
          (l.handle && (l.handle.name === 'verifyToken' || l.handle.name === 'auth'))
        );

        // Pass the current router's handle to child routes
        getRoutes(layer.handle.stack, (parentPath + newPath).replace(/\/+/g, '/'), moduleName, routerHasAuth || parentHasAuth, layer.handle);
      }
    });
  }

  getRoutes(req.app._router.stack);

  // Sort modules alphabetically
  const sortedModules = Object.keys(routesByModule).sort();

  let routeIndex = 0; // For unique IDs

  let html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>ERP API Live Tester</title>
    <style>
      :root {
        --primary: #667eea;
        --secondary: #764ba2;
        --success: #28a745;
        --danger: #dc3545;
        --warning: #ffc107;
        --info: #17a2b8;
        --dark: #2c3e50;
        --light: #f8f9fa;
        --border: #dee2e6;
      }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { 
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
        background: #f4f7f6;
        color: #333;
        padding-bottom: 50px;
      }
      .navbar {
        background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
        color: white;
        padding: 15px 30px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        position: sticky;
        top: 0;
        z-index: 1000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      }
      .navbar h1 { font-size: 20px; font-weight: 600; }
      .auth-controls { display: flex; gap: 10px; align-items: center; }
      .btn {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 600;
        font-size: 13px;
        transition: all 0.2s;
      }
      .btn-primary { background: var(--primary); color: white; }
      .btn-light { background: white; color: var(--primary); }
      .btn-success { background: var(--success); color: white; }
      .btn-danger { background: var(--danger); color: white; }
      .btn:hover { opacity: 0.9; transform: translateY(-1px); }
      
      .container { max-width: 1200px; margin: 30px auto; padding: 0 20px; }
      
      .module-section {
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        margin-bottom: 30px;
        overflow: hidden;
      }
      .module-header {
        background: #fff;
        padding: 20px;
        border-bottom: 1px solid var(--border);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .module-header h2 { color: var(--dark); font-size: 18px; }
      .route-count { background: var(--warning); padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; }
      
      .route-item {
        border-bottom: 1px solid var(--border);
      }
      .route-item:last-child { border-bottom: none; }
      
      .route-header {
        padding: 15px 20px;
        display: flex;
        align-items: center;
        gap: 15px;
        cursor: pointer;
        background: white;
        transition: background 0.2s;
      }
      .route-header:hover { background: #f8f9fa; }
      
      .method { 
        font-weight: bold; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; min-width: 50px; text-align: center;
      }
      .GET { background-color: var(--success); }
      .POST { background-color: #007bff; }
      .PUT { background-color: var(--warning); color: #333; }
      .DELETE { background-color: var(--danger); }
      
      .path { font-family: monospace; font-weight: 600; color: var(--dark); flex-grow: 1; }
      .auth-badge { font-size: 10px; padding: 3px 6px; border-radius: 3px; font-weight: bold; text-transform: uppercase; }
      .auth-badge.protected { background: #ffebee; color: #c62828; border: 1px solid #ffcdd2; }
      .auth-badge.public { background: #e8f5e9; color: #2e7d32; border: 1px solid #c8e6c9; }
      
      .route-body {
        display: none;
        padding: 20px;
        background: #f8f9fa;
        border-top: 1px solid var(--border);
      }
      .route-body.expanded { display: block; }
      
      .test-panel {
        background: white;
        border: 1px solid var(--border);
        border-radius: 6px;
        padding: 20px;
        margin-top: 15px;
      }
      
      .form-group { margin-bottom: 15px; }
      .form-group label { display: block; font-size: 12px; font-weight: 600; margin-bottom: 5px; color: #666; }
      .form-control {
        width: 100%;
        padding: 8px;
        border: 1px solid var(--border);
        border-radius: 4px;
        font-family: monospace;
        font-size: 13px;
      }
      textarea.form-control { min-height: 150px; }
      
      .response-area {
        margin-top: 20px;
        border-top: 1px solid var(--border);
        padding-top: 20px;
        display: none;
      }
      .response-area.visible { display: block; }
      
      .status-line { display: flex; gap: 15px; margin-bottom: 10px; font-size: 13px; font-weight: 600; }
      .status-success { color: var(--success); }
      .status-error { color: var(--danger); }
      
      .tabs { display: flex; gap: 5px; margin-bottom: 15px; border-bottom: 1px solid var(--border); }
      .tab { padding: 8px 16px; cursor: pointer; border-bottom: 2px solid transparent; font-size: 13px; font-weight: 600; color: #666; }
      .tab.active { border-bottom-color: var(--primary); color: var(--primary); }
      
      .login-modal {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.5);
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 2000;
      }
      .login-modal.visible { display: flex; }
      .login-box {
        background: white;
        padding: 30px;
        border-radius: 8px;
        width: 350px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      }
      .login-box h3 { margin-bottom: 20px; text-align: center; }
      
      pre { background: #2d2d2d; color: #f8f8f2; padding: 15px; border-radius: 4px; overflow-x: auto; }
    </style>
  </head>
  <body>
    <nav class="navbar">
      <h1>🚀 ERP API Live Tester</h1>
      <div class="auth-controls" id="authControls">
        <a href="/routes-tree" class="btn btn-light" target="_blank">📚 Documentation</a>
        <button class="btn btn-light" onclick="showLogin()">Login</button>
      </div>
    </nav>

    <div class="container">
      <div id="modulesContainer">
  `;

  // Generate Routes HTML
  sortedModules.forEach(moduleName => {
    const routeCount = routesByModule[moduleName].length;
    html += `
      <div class="module-section">
        <div class="module-header">
          <h2>${moduleName}</h2>
          <span class="route-count">${routeCount}</span>
        </div>
        <div class="routes-list">
    `;

    routesByModule[moduleName].forEach((route, idx) => {
      const routeId = `route-${moduleName.replace(/\s+/g, '-')}-${idx}`;
      const isProtected = route.auth === 'Protected';

      // Prepare default body
      let defaultBody = '{}';
      if (route.sampleRequest) {
        defaultBody = JSON.stringify(route.sampleRequest, null, 2);
      }

      html += `
        <div class="route-item" id="${routeId}">
          <div class="route-header" onclick="toggleRoute('${routeId}')">
            <span class="method ${route.methods[0]}">${route.methods[0]}</span>
            <span class="path">${route.path}</span>
            <span class="auth-badge ${isProtected ? 'protected' : 'public'}">${route.auth}</span>
          </div>
          <div class="route-body">
            <div class="description">
              ${route.description || 'No description available'}
            </div>
            
            ${route.database ? `
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; border-radius: 4px;">
              <h4 style="margin: 0 0 10px 0; color: #856404; font-size: 14px;">📊 Database Schema</h4>
              
              ${route.database.mainTable ? `<div style="margin-bottom: 8px;"><strong>Main Table:</strong> <code>${route.database.mainTable}</code></div>` : ''}
              
              ${route.database.tables ? `<div style="margin-bottom: 8px;"><strong>Tables:</strong> ${route.database.tables.map(t => `<code>${t}</code>`).join(', ')}</div>` : ''}
              
              ${route.database.fields ? `
              <details style="margin-top: 10px;">
                <summary style="cursor: pointer; font-weight: 600; color: #856404;">Fields by Table</summary>
                <div style="margin-top: 10px; padding-left: 15px;">
                  ${Object.entries(route.database.fields).map(([table, fields]) => `
                    <div style="margin-bottom: 10px;">
                      <strong>${table}:</strong><br>
                      <code style="font-size: 11px;">${fields.join(', ')}</code>
                    </div>
                  `).join('')}
                </div>
              </details>
              ` : ''}
              
              ${route.database.requiredFields ? `<div style="margin-top: 8px;"><strong>Required Fields:</strong> <code>${route.database.requiredFields.join(', ')}</code></div>` : ''}
              
              ${route.database.optionalFields ? `<div style="margin-top: 8px;"><strong>Optional Fields:</strong> <code style="font-size: 11px;">${route.database.optionalFields.join(', ')}</code></div>` : ''}
              
              ${route.database.autoGeneratedFields ? `<div style="margin-top: 8px;"><strong>Auto-Generated:</strong> <code>${route.database.autoGeneratedFields.join(', ')}</code></div>` : ''}
              
              ${route.database.relationships ? `
              <details style="margin-top: 10px;">
                <summary style="cursor: pointer; font-weight: 600; color: #856404;">Relationships</summary>
                <ul style="margin: 10px 0 0 20px; font-size: 12px;">
                  ${route.database.relationships.map(r => `<li><code>${r}</code></li>`).join('')}
                </ul>
              </details>
              ` : ''}
              
              ${route.database.sideEffects ? `
              <div style="margin-top: 10px; padding: 10px; background: #fff; border-radius: 4px;">
                <strong style="color: #dc3545;">⚠️ Side Effects:</strong>
                <ul style="margin: 5px 0 0 20px; font-size: 12px;">
                  ${route.database.sideEffects.map(e => `<li>${e}</li>`).join('')}
                </ul>
              </div>
              ` : ''}
            </div>
            ` : ''}

            ${route.calculation ? `
            <div style="background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 15px 0; border-radius: 4px;">
              <h4 style="margin: 0 0 10px 0; color: #2e7d32; font-size: 14px;">🧮 Calculation Logic</h4>
              <p style="font-size: 13px; color: #333; white-space: pre-wrap;">${route.calculation}</p>
            </div>
            ` : ''}

            ${route.actions ? `
            <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 15px 0; border-radius: 4px;">
              <h4 style="margin: 0 0 10px 0; color: #1565c0; font-size: 14px;">⚡ Available Actions</h4>
              <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                ${route.actions.map(action => `
                  <span style="background: #2196f3; color: white; padding: 4px 12px; border-radius: 16px; font-size: 12px; font-weight: 600;">
                    ${action}
                  </span>
                `).join('')}
              </div>
            </div>
            ` : ''}
            
            ${(route.examples && route.examples.length > 0) || route.sampleResponse ? `
            <div style="background: #e7f3ff; border-left: 4px solid #2196F3; padding: 15px; margin: 15px 0; border-radius: 4px;">
              <h4 style="margin: 0 0 15px 0; color: #1565C0; font-size: 14px;">✅ Sample Request URLs & Responses</h4>
              
              ${(route.examples || [{
            title: 'Default Response',
            description: 'Standard successful response for this endpoint',
            method: route.methods[0],
            url: route.path,
            response: route.sampleResponse
          }]).map((example, idx) => `
                <details style="margin-bottom: 15px; background: white; padding: 12px; border-radius: 4px; border: 1px solid #90CAF9;" ${idx === 0 ? 'open' : ''}>
                  <summary style="cursor: pointer; font-weight: 600; color: #1565C0; font-size: 13px;">
                    ${example.title || `Example ${idx + 1}`}
                  </summary>
                  <div style="margin-top: 10px; padding-left: 10px;">
                    ${example.description ? `<p style="color: #666; font-size: 12px; margin-bottom: 10px;">${example.description}</p>` : ''}
                    
                    <div style="margin-bottom: 10px;">
                      <strong style="font-size: 12px; color: #1565C0;">Request:</strong>
                      <div style="background: #f5f5f5; padding: 8px; border-radius: 4px; margin-top: 5px; font-family: monospace; font-size: 11px; overflow-x: auto;">
                        <span style="color: #2E7D32; font-weight: bold;">${example.method || 'GET'}</span> ${example.url}
                      </div>
                    </div>
                    
                    ${example.request ? `
                    <div style="margin-bottom: 10px;">
                      <strong style="font-size: 12px; color: #1565C0;">Request Body:</strong>
                      <pre style="background: #f5f5f5; color: #333; padding: 8px; border-radius: 4px; margin-top: 5px; font-size: 11px; overflow-x: auto; max-height: 200px;">${JSON.stringify(example.request, null, 2)}</pre>
                    </div>
                    ` : ''}
                    
                    ${example.response ? `
                    <div>
                      <strong style="font-size: 12px; color: #1565C0;">Sample Response:</strong>
                      <pre style="background: #263238; color: #ADBAC7; padding: 12px; border-radius: 4px; margin-top: 5px; font-size: 11px; overflow-x: auto; max-height: 400px;">${JSON.stringify(example.response, null, 2)}</pre>
                    </div>
                    ` : ''}
                  </div>
                </details>
              `).join('')}
            </div>
            ` : ''}
            
            <div class="test-panel">
      <div class="tabs">
        <div class="tab active" onclick="switchTab('${routeId}', 'params')">Params</div>
        <div class="tab" onclick="switchTab('${routeId}', 'body')">Body</div>
        <div class="tab" onclick="switchTab('${routeId}', 'auth')">Auth</div>
      </div>

      <div class="tab-content" id="${routeId}-params">
        <div class="form-group">
          <label>URL Parameters (e.g. :id)</label>
          <div id="${routeId}-url-params"></div>
        </div>
        <!-- Query Params could go here -->
      </div>

      <div class="tab-content" id="${routeId}-body" style="display:none">
        <div class="form-group">
          <label>Request Body (JSON)</label>
          <textarea class="form-control" id="${routeId}-request-body">${defaultBody}</textarea>
        </div>
      </div>

      <div class="tab-content" id="${routeId}-auth" style="display:none">
        <div class="form-group">
          <label>Authorization Header</label>
          <input type="text" class="form-control" id="${routeId}-auth-header" value="${isProtected ? 'Bearer <TOKEN>' : ''}" readonly>
            <small style="color: #666">Token is automatically added from login</small>
        </div>
      </div>

      <button class="btn btn-primary" onclick="executeRequest('${routeId}', '${route.methods[0]}', '${route.path}')">Send Request 🚀</button>

      <div class="response-area" id="${routeId}-response">
        <div class="status-line">
          <span id="${routeId}-status"></span>
          <span id="${routeId}-time"></span>
        </div>
        <pre id="${routeId}-response-body"></pre>
      </div>
    </div>
          </div >
        </div >
    `;
    });

    html += `
        </div >
      </div >
    `;
  });

  html += `
      </div >
    </div >


    <div class="login-modal" id="loginModal">
      <div class="login-box">
        <h3>Login to ERP</h3>
        <div class="form-group">
          <label>Email</label>
          <input type="email" class="form-control" id="loginEmail" value="admin@gmail.com" autocomplete="off">
        </div>
        <div class="form-group">
          <label>Password</label>
          <input type="password" class="form-control" id="loginPassword" value="password123" autocomplete="off">
        </div>
        <button class="btn btn-primary" style="width:100%" onclick="performLogin()">Login</button>
        <button class="btn btn-light" style="width:100%; margin-top: 10px" onclick="closeLogin()">Cancel</button>
      </div>
    </div>
    <script>
      // State
      let authToken = localStorage.getItem('erp_token');
      let user = null;

      // Init
      function init() {
        if (authToken) {
          updateAuthUI(true);
        }
        detectUrlParams();
      }

      function detectUrlParams() {
        document.querySelectorAll('.route-item').forEach(item => {
          const path = item.querySelector('.path').textContent;
          const routeId = item.id;
          const paramsContainer = document.getElementById(routeId + '-url-params');
          
          // Find :param in path
          const matches = path.match(/:[a-zA-Z0-9_]+/g);
          if (matches) {
            matches.forEach(param => {
              const key = param.substring(1);
              const div = document.createElement('div');
              div.style.marginBottom = '5px';
              div.innerHTML = \`
                <input type="text" class="form-control url-param-input" 
                  data-key="\${param}" placeholder="\${key} value" style="width: 200px">
              \`;
              paramsContainer.appendChild(div);
            });
          } else {
            paramsContainer.innerHTML = '<small>No URL parameters</small>';
          }
        });
      }

      // Auth Functions
      function showLogin() { document.getElementById('loginModal').classList.add('visible'); }
      function closeLogin() { document.getElementById('loginModal').classList.remove('visible'); }
      
      async function performLogin() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });
          const data = await res.json();

          if (data.status) {
            authToken = data.data.token;
            localStorage.setItem('erp_token', authToken);
            updateAuthUI(true);
            closeLogin();
            alert('Login Successful!');
          } else {
            alert('Login Failed: ' + data.message);
          }
        } catch (e) {
          alert('Error: ' + e.message);
        }
      }

      function logout() {
        authToken = null;
        localStorage.removeItem('erp_token');
        updateAuthUI(false);
      }

      function updateAuthUI(isLoggedIn) {
        const container = document.getElementById('authControls');
        if (isLoggedIn) {
          container.innerHTML = \`
            <span style="font-size:12px; margin-right:10px">Logged in</span>
            <button class="btn btn-danger" onclick="logout()">Logout</button>
          \`;
          // Update all auth headers
          document.querySelectorAll('[id$="-auth-header"]').forEach(el => {
            if (el.value.includes('Bearer')) el.value = 'Bearer ' + authToken;
          });
        } else {
          container.innerHTML = '<button class="btn btn-light" onclick="showLogin()">Login</button>';
        }
      }

      // UI Functions
      function toggleRoute(id) {
        document.getElementById(id).querySelector('.route-body').classList.toggle('expanded');
      }

      function switchTab(routeId, tabName) {
        // Hide all content
        ['params', 'body', 'auth'].forEach(t => {
          document.getElementById(\`\${routeId}-\${t}\`).style.display = 'none';
        });
        // Show selected
        document.getElementById(\`\${routeId}-\${tabName}\`).style.display = 'block';
        
        // Update tabs
        const tabs = document.getElementById(routeId).querySelectorAll('.tab');
        tabs.forEach(t => t.classList.remove('active'));
        event.target.classList.add('active');
      }

      // Request Execution
      async function executeRequest(routeId, method, pathTemplate) {
        const startTime = Date.now();
        const responseArea = document.getElementById(\`\${routeId}-response\`);
        const statusEl = document.getElementById(\`\${routeId}-status\`);
        const timeEl = document.getElementById(\`\${routeId}-time\`);
        const bodyEl = document.getElementById(\`\${routeId}-response-body\`);
        
        responseArea.classList.add('visible');
        bodyEl.textContent = 'Loading...';
        statusEl.textContent = '';
        
        try {
          // 1. Build URL
          let url = pathTemplate;
          const paramInputs = document.getElementById(routeId + '-url-params').querySelectorAll('input');
          paramInputs.forEach(input => {
            const key = input.dataset.key;
            const val = input.value;
            url = url.replace(key, val);
          });
          
          // Prepend API prefix if needed (assuming relative to root)
          if (!url.startsWith('/api')) url = '/api' + url; // Adjust based on your routing
          // Actually the path from routesTree already includes /api prefix usually? 
          // Let's check: route.path usually is relative to module. 
          // The routesTree logic constructs fullPath. Let's assume fullPath is correct.
          // Wait, the routesTree.js logic constructs fullPath. 
          // If the path in UI is /products/:id, and it's mounted at /api, we need to be careful.
          // The current routesTree implementation seems to build paths like /products/:id.
          // We might need to prepend /api if the router is mounted at /api in app.js.
          // In app.js: app.use('/api', routes);
          // So yes, we likely need to prepend /api if it's not there.
          if (!url.startsWith('/api')) url = '/api' + url;

          // 2. Prepare Headers
          const headers = {};
          if (authToken) {
            headers['Authorization'] = 'Bearer ' + authToken;
          }
          
          // 3. Prepare Body
          let body = null;
          if (['POST', 'PUT', 'PATCH'].includes(method)) {
            const rawBody = document.getElementById(\`\${routeId}-request-body\`).value;
            
            // Check if we need multipart (simple check for now)
            // For this simple version, we'll stick to JSON unless we detect file inputs (which we haven't implemented fully yet)
            // But we can support JSON body editing.
            try {
              if (rawBody.trim()) {
                JSON.parse(rawBody); // Validate JSON
                headers['Content-Type'] = 'application/json';
                body = rawBody;
              }
            } catch (e) {
              alert('Invalid JSON in body');
              return;
            }
          }

          // 4. Execute
          const res = await fetch(url, {
            method,
            headers,
            body
          });
          
          const data = await res.json();
          const time = Date.now() - startTime;
          
          // 5. Render
          statusEl.textContent = \`Status: \${res.status} \${res.statusText}\`;
          statusEl.className = res.ok ? 'status-success' : 'status-error';
          timeEl.textContent = \`\${time}ms\`;
          bodyEl.textContent = JSON.stringify(data, null, 2);
          
        } catch (e) {
          statusEl.textContent = 'Error';
          statusEl.className = 'status-error';
          bodyEl.textContent = e.message;
        }
      }

      // Start
      init();
    </script>
  </body >
  </html >
    `;

  res.send(html);
});

module.exports = router;
