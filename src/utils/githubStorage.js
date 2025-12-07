// GitHub Storage Utility for KHPL Registration Data
// Uses GitHub API to store data files in a repository

// Function to verify GitHub repository access
export const verifyGitHubAccess = async () => {
  const config = {
    owner: process.env.REACT_APP_GITHUB_OWNER || 'pavanreddy2928',
    repo: process.env.REACT_APP_GITHUB_REPO || 'KHPL',
    token: process.env.REACT_APP_GITHUB_TOKEN || '',
    enabled: process.env.REACT_APP_GITHUB_STORAGE === 'true'
  };

  if (!config.enabled || !config.token) {
    return { success: false, reason: 'GitHub storage not configured' };
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${config.owner}/${config.repo}`,
      {
        headers: {
          'Authorization': `token ${config.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    if (response.ok) {
      const repoData = await response.json();
      return { 
        success: true, 
        repository: repoData.full_name,
        private: repoData.private,
        permissions: repoData.permissions
      };
    } else if (response.status === 403) {
      return { success: false, reason: 'Token lacks repository access permissions', code: 403 };
    } else if (response.status === 404) {
      return { success: false, reason: 'Repository not found or not accessible', code: 404 };
    } else {
      return { success: false, reason: `GitHub API error: ${response.status}`, code: response.status };
    }
  } catch (error) {
    return { success: false, reason: `Network error: ${error.message}` };
  }
};

const GITHUB_CONFIG = {
  owner: process.env.REACT_APP_GITHUB_OWNER || 'pavanreddy2928', // Replace with your GitHub username
  repo: process.env.REACT_APP_GITHUB_REPO || 'KHPL', // Replace with your repository name
  token: process.env.REACT_APP_GITHUB_TOKEN, // Personal Access Token - must be set in environment variables
  branch: 'main',
  enabled: true // Only enable if explicitly set
};

export const saveToGitHub = async (filename, data) => {
  // Check if GitHub storage is enabled and configured
  if (!GITHUB_CONFIG.enabled || !GITHUB_CONFIG.token) {
    console.log('GitHub storage is disabled or not configured, using localStorage only');
    return { success: false, reason: 'GitHub storage not configured' };
  }

  try {
    const content = btoa(JSON.stringify(data, null, 2)); // Base64 encode
    
    // Check if file exists to get SHA
    let sha = null;
    try {
      const existingFile = await fetch(
        `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${filename}`,
        {
          headers: {
            'Authorization': `token ${GITHUB_CONFIG.token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );
      if (existingFile.ok) {
        const fileData = await existingFile.json();
        sha = fileData.sha;
      }
    } catch (error) {
      // File doesn't exist, which is fine for new files
    }

    // Create or update file
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${filename}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `token ${GITHUB_CONFIG.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
          message: `Update ${filename} - ${new Date().toISOString()}`,
          content: content,
          ...(sha && { sha }) // Include SHA if file exists
        })
      }
    );

    if (response.ok) {
      console.log('Successfully saved to GitHub:', filename);
      return { success: true };
    } else if (response.status === 403) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown 403 error' }));
      console.error('❌ GitHub Permission Error (403)');
      console.error('Message:', errorData.message);
      console.error('📝 To fix this:');
      console.error('   1. Go to https://github.com/settings/tokens');
      console.error('   2. Generate a new token with "repo" scope (for private repos)');
      console.error('   3. Or use "public_repo" scope (for public repos)');
      console.error('   4. Update REACT_APP_GITHUB_TOKEN in your .env file');
      return { success: false, error: 'Insufficient permissions', code: 403 };
    } else {
      const errorText = await response.text();
      console.error('GitHub save failed:', response.status, errorText);
      return { success: false, error: `HTTP ${response.status}`, code: response.status };
    }
  } catch (error) {
    console.error('GitHub storage error:', error);
    return { success: false, error: error.message };
  }
};

export const loadFromGitHub = async (filename) => {
  // Check if GitHub storage is enabled and configured
  if (!GITHUB_CONFIG.enabled || !GITHUB_CONFIG.token) {
    console.log('GitHub storage is disabled or not configured, using localStorage only');
    return null;
  }

  try {
    const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${filename}`;
    console.log('Loading from GitHub URL:', url);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `token ${GITHUB_CONFIG.token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (response.ok) {
      const fileData = await response.json();
      const content = atob(fileData.content.replace(/\s/g, '')); // Base64 decode, remove whitespace
      console.log('Successfully loaded from GitHub:', filename);
      return JSON.parse(content);
    } else if (response.status === 404) {
      console.log('File not found on GitHub (this is normal for first registration):', filename);
      return null; // File doesn't exist yet, this is normal for first time
    } else if (response.status === 403) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown 403 error' }));
      console.error('❌ GitHub Access Forbidden (403)');
      console.error('Error:', errorData.message);
      console.error('📝 Common solutions:');
      console.error('   • Verify the repository exists and is accessible');
      console.error('   • Check if the repository is private and token has "repo" scope');
      console.error('   • For public repos, ensure token has "public_repo" scope');
      console.error('   • Generate a new token at: https://github.com/settings/tokens');
      return null;
    } else {
      const errorText = await response.text();
      console.error('GitHub load error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        url: url
      });
      return null;
    }
  } catch (error) {
    console.error('GitHub load error:', error);
    return null;
  }
};