// Hybrid Storage Strategy for KHPL
// Combines localStorage (instant) + cloud backup (persistent)

export class HybridStorage {
  constructor(cloudProvider = 'localStorage') {
    this.cloudProvider = cloudProvider;
    this.localKey = 'khplRegistrations';
  }

  // Save to both local and cloud
  async saveRegistration(registrationData) {
    try {
      // 1. Save locally first (instant)
      const localData = this.getLocal();
      const newRegistration = {
        ...registrationData,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        syncStatus: 'pending'
      };
      
      localData.push(newRegistration);
      localStorage.setItem(this.localKey, JSON.stringify(localData));

      // 2. Sync to cloud in background
      this.syncToCloud();
      
      return newRegistration;
    } catch (error) {
      console.error('Save error:', error);
      throw error;
    }
  }

  // Get from local storage (fast)
  getLocal() {
    try {
      return JSON.parse(localStorage.getItem(this.localKey) || '[]');
    } catch {
      return [];
    }
  }

  // Sync pending records to cloud
  async syncToCloud() {
    const localData = this.getLocal();
    const pendingRecords = localData.filter(r => r.syncStatus === 'pending');

    for (const record of pendingRecords) {
      try {
        // Choose your cloud provider
        switch (this.cloudProvider) {
          case 'github':
            await this.saveToGitHub(record);
            break;
          case 'firebase':
            await this.saveToFirebase(record);
            break;
          case 'supabase':
            await this.saveToSupabase(record);
            break;
          default:
            // localStorage only
            break;
        }

        // Mark as synced
        record.syncStatus = 'synced';
      } catch (error) {
        console.error('Cloud sync failed for record:', record.id, error);
        record.syncStatus = 'failed';
      }
    }

    // Update local storage with sync status
    localStorage.setItem(this.localKey, JSON.stringify(localData));
  }

  // Export to Excel (existing functionality)
  exportToExcel() {
    const data = this.getLocal();
    // Your existing Excel export code
    return data;
  }

  // Manual cloud backup
  async createBackup() {
    const data = this.getLocal();
    const backupData = {
      timestamp: new Date().toISOString(),
      registrations: data,
      totalCount: data.length
    };

    switch (this.cloudProvider) {
      case 'github':
        await this.saveToGitHub(backupData, `backup-${Date.now()}.json`);
        break;
      // Add other providers
    }
  }

  async saveToGitHub(data, filename = 'registrations.json') {
    // Implementation using GitHub API
    // (Use the githubStorage.js utility)
  }

  async saveToFirebase(data) {
    // Implementation using Firebase
    // (Use the firebaseStorage.js utility)
  }

  async saveToSupabase(data) {
    // Implementation using Supabase
    // (Use the supabaseStorage.js utility)
  }
}

// Usage in your components
export const storage = new HybridStorage('localStorage'); // or 'github', 'firebase', 'supabase'