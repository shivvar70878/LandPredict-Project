/**
 * LandPredict AI - Universal Supabase & PostgreSQL Cloud Client
 * Project Reference: kfeicdqlhgrrogjlbitl
 * Cloud Endpoint: https://kfeicdqlhgrrogjlbitl.supabase.co
 */

(function (window) {
  'use strict';

  const SUPABASE_CONFIG = {
    projectId: 'kfeicdqlhgrrogjlbitl',
    url: 'https://kfeicdqlhgrrogjlbitl.supabase.co',
    publishableKey: 'sb_publishable_dDAcKIH-RLMvJcudttbPZw_JYRJPezX',
    apiVersion: 'v1'
  };

  class SupabaseCloudClient {
    constructor(config) {
      this.url = config.url.replace(/\/+$/, '');
      this.key = config.publishableKey;
      this.projectId = config.projectId;
      this.restBase = `${this.url}/rest/v1`;
      this.isConnected = null;
    }

    getHeaders(extraHeaders = {}) {
      return {
        'apikey': this.key,
        'Authorization': `Bearer ${this.key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        ...extraHeaders
      };
    }

    /**
     * Test active connection to Supabase PostgREST & PostgreSQL database
     */
    async checkConnection() {
      try {
        const resp = await fetch(`${this.restBase}/`, {
          method: 'GET',
          headers: {
            'apikey': this.key,
            'Authorization': `Bearer ${this.key}`
          }
        });
        this.isConnected = resp.ok;
        return {
          ok: resp.ok,
          status: resp.status,
          projectId: this.projectId,
          url: this.url,
          engine: 'PostgreSQL 15 (Supabase Cloud)'
        };
      } catch (err) {
        this.isConnected = false;
        return {
          ok: false,
          error: err.message,
          projectId: this.projectId,
          url: this.url,
          engine: 'PostgreSQL 15 (Supabase Cloud)'
        };
      }
    }

    /**
     * Fetch all projects from Supabase PostgreSQL projects table
     */
    async getProjects(filters = {}) {
      try {
        let queryParams = [];
        if (filters.state && filters.state.toLowerCase() !== 'all') {
          queryParams.push(`state=eq.${encodeURIComponent(filters.state)}`);
        }
        if (filters.project_type && filters.project_type.toLowerCase() !== 'all') {
          queryParams.push(`project_type=eq.${encodeURIComponent(filters.project_type)}`);
        }
        if (filters.delayed === 'delayed') {
          queryParams.push(`is_delayed=eq.1`);
        } else if (filters.delayed === 'not-delayed') {
          queryParams.push(`is_delayed=eq.0`);
        }

        const qs = queryParams.length ? `?${queryParams.join('&')}&order=id.desc` : '?order=id.desc';
        const resp = await fetch(`${this.restBase}/projects${qs}`, {
          method: 'GET',
          headers: this.getHeaders()
        });

        if (!resp.ok) {
          throw new Error(`Supabase returned HTTP ${resp.status}`);
        }

        const data = await resp.json();
        return { ok: true, data: Array.isArray(data) ? data : [] };
      } catch (err) {
        console.warn('[SupabaseClient] getProjects error:', err);
        return { ok: false, error: err.message, data: [] };
      }
    }

    /**
     * Fetch single project by project_id
     */
    async getProjectById(projectId) {
      try {
        const resp = await fetch(`${this.restBase}/projects?project_id=eq.${encodeURIComponent(projectId)}&limit=1`, {
          method: 'GET',
          headers: this.getHeaders()
        });
        if (!resp.ok) throw new Error(`Supabase returned HTTP ${resp.status}`);
        const list = await resp.json();
        return { ok: true, data: list.length ? list[0] : null };
      } catch (err) {
        return { ok: false, error: err.message };
      }
    }

    /**
     * Save / Upsert a project into Supabase PostgreSQL
     */
    async saveProject(projectRecord) {
      try {
        const resp = await fetch(`${this.restBase}/projects`, {
          method: 'POST',
          headers: this.getHeaders({
            'Prefer': 'resolution=merge-duplicates,return=representation'
          }),
          body: JSON.stringify(projectRecord)
        });
        if (!resp.ok) {
          const errText = await resp.text();
          throw new Error(`Failed to save project to Supabase: ${errText}`);
        }
        const saved = await resp.json();
        return { ok: true, data: saved };
      } catch (err) {
        console.error('[SupabaseClient] saveProject error:', err);
        return { ok: false, error: err.message };
      }
    }

    /**
     * Delete project from Supabase PostgreSQL
     */
    async deleteProject(projectId) {
      try {
        const resp = await fetch(`${this.restBase}/projects?project_id=eq.${encodeURIComponent(projectId)}`, {
          method: 'DELETE',
          headers: this.getHeaders()
        });
        return { ok: resp.ok };
      } catch (err) {
        return { ok: false, error: err.message };
      }
    }

    /**
     * Get user by email from Supabase users table
     */
    async getUserByEmail(email) {
      try {
        const cleanEmail = email.trim().toLowerCase();
        const resp = await fetch(`${this.restBase}/users?email=eq.${encodeURIComponent(cleanEmail)}&limit=1`, {
          method: 'GET',
          headers: this.getHeaders()
        });
        if (!resp.ok) throw new Error(`Supabase HTTP ${resp.status}`);
        const rows = await resp.json();
        return { ok: true, user: rows.length ? rows[0] : null };
      } catch (err) {
        return { ok: false, error: err.message };
      }
    }

    /**
     * Create user record in Supabase users table
     */
    async createUser(userObj) {
      try {
        const resp = await fetch(`${this.restBase}/users`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(userObj)
        });
        if (!resp.ok) {
          const errText = await resp.text();
          throw new Error(errText);
        }
        const created = await resp.json();
        return { ok: true, user: created[0] || created };
      } catch (err) {
        return { ok: false, error: err.message };
      }
    }

    /**
     * Fetch State Revenue Portals from Supabase portal_registry table
     */
    async getPortals() {
      try {
        const resp = await fetch(`${this.restBase}/portal_registry?order=id.asc`, {
          method: 'GET',
          headers: this.getHeaders()
        });
        if (!resp.ok) throw new Error(`Supabase HTTP ${resp.status}`);
        const portals = await resp.json();
        return { ok: true, portals: portals };
      } catch (err) {
        return { ok: false, error: err.message, portals: [] };
      }
    }

    /**
     * Record AI inference prediction in Supabase predictions table
     */
    async recordPrediction(predObj) {
      try {
        const resp = await fetch(`${this.restBase}/predictions`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(predObj)
        });
        return { ok: resp.ok };
      } catch (err) {
        return { ok: false, error: err.message };
      }
    }
  }

  // Instantiate and bind globally
  window.supabaseClient = new SupabaseCloudClient(SUPABASE_CONFIG);
  window.SUPABASE_CONFIG = SUPABASE_CONFIG;

  console.log('[SupabaseClient] Initialized for Project:', SUPABASE_CONFIG.projectId, '(PostgreSQL Cloud)');
})(window);
