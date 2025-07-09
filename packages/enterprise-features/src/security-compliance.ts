/**
 * Enterprise Security and Compliance Features
 * SOC2, PCI-DSS compliance, RBAC, audit logging, and multi-tenancy support
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { createLogger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import Joi from 'joi';
import moment from 'moment';
import _ from 'lodash';

// Security interfaces
export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  rules: SecurityRule[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SecurityRule {
  id: string;
  type: 'access' | 'data' | 'network' | 'audit';
  condition: string;
  action: 'allow' | 'deny' | 'log' | 'alert';
  parameters: Record<string, any>;
}

export interface User {
  id: string;
  username: string;
  email: string;
  roles: string[];
  tenantId: string;
  permissions: string[];
  lastLogin: string;
  isActive: boolean;
  mfaEnabled: boolean;
  createdAt: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  tenantId: string;
  isSystem: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  tenantId: string;
  action: string;
  resource: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  severity: 'info' | 'warn' | 'error' | 'critical';
  compliant: boolean;
}

export interface ComplianceReport {
  id: string;
  tenantId: string;
  framework: 'soc2' | 'pci-dss' | 'gdpr' | 'hipaa';
  status: 'compliant' | 'non-compliant' | 'partial';
  score: number;
  findings: ComplianceFinding[];
  recommendations: string[];
  generatedAt: string;
  validUntil: string;
}

export interface ComplianceFinding {
  id: string;
  control: string;
  status: 'pass' | 'fail' | 'warning';
  description: string;
  evidence: string[];
  remediation: string;
  risk: 'low' | 'medium' | 'high' | 'critical';
}

export class SecurityManager extends EventEmitter {
  private policies: Map<string, SecurityPolicy> = new Map();
  private users: Map<string, User> = new Map();
  private roles: Map<string, Role> = new Map();
  private auditLogger: any;
  private encryptionKey: string;
  private jwtSecret: string;

  constructor(config: {
    encryptionKey: string;
    jwtSecret: string;
    auditLogPath: string;
  }) {
    super();
    this.encryptionKey = config.encryptionKey;
    this.jwtSecret = config.jwtSecret;
    this.setupAuditLogging(config.auditLogPath);
    this.initializeDefaultPolicies();
  }

  private setupAuditLogging(logPath: string): void {
    this.auditLogger = createLogger({
      level: 'info',
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json()
      ),
      transports: [
        new DailyRotateFile({
          filename: `${logPath}/audit-%DATE%.log`,
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d'
        }),
        new transports.Console({
          format: format.combine(
            format.colorize(),
            format.simple()
          )
        })
      ]
    });
  }

  private initializeDefaultPolicies(): void {
    // Create default security policies
    const defaultPolicies: SecurityPolicy[] = [
      {
        id: uuidv4(),
        name: 'Strong Password Policy',
        description: 'Enforce strong password requirements',
        rules: [
          {
            id: uuidv4(),
            type: 'access',
            condition: 'password.length >= 12 && password.complexity >= 3',
            action: 'deny',
            parameters: {
              minLength: 12,
              requireUppercase: true,
              requireLowercase: true,
              requireNumbers: true,
              requireSpecialChars: true
            }
          }
        ],
        severity: 'high',
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        name: 'Multi-Factor Authentication',
        description: 'Require MFA for all users',
        rules: [
          {
            id: uuidv4(),
            type: 'access',
            condition: 'user.mfaEnabled === true',
            action: 'deny',
            parameters: {
              mfaRequired: true,
              gracePeriod: 30 // days
            }
          }
        ],
        severity: 'critical',
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        name: 'Data Encryption',
        description: 'Encrypt sensitive data at rest and in transit',
        rules: [
          {
            id: uuidv4(),
            type: 'data',
            condition: 'data.classification === "sensitive"',
            action: 'log',
            parameters: {
              algorithm: 'AES-256-GCM',
              keyRotationDays: 90
            }
          }
        ],
        severity: 'critical',
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    defaultPolicies.forEach(policy => {
      this.policies.set(policy.id, policy);
    });
  }

  // User Management
  public async createUser(userData: {
    username: string;
    email: string;
    password: string;
    roles: string[];
    tenantId: string;
  }): Promise<User> {
    // Validate input
    const schema = Joi.object({
      username: Joi.string().min(3).max(50).required(),
      email: Joi.string().email().required(),
      password: Joi.string().min(12).required(),
      roles: Joi.array().items(Joi.string()).required(),
      tenantId: Joi.string().uuid().required()
    });

    const { error } = schema.validate(userData);
    if (error) {
      throw new Error(`Invalid user data: ${error.details[0].message}`);
    }

    // Check password policy
    await this.validatePasswordPolicy(userData.password);

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    const user: User = {
      id: uuidv4(),
      username: userData.username,
      email: userData.email,
      roles: userData.roles,
      tenantId: userData.tenantId,
      permissions: await this.calculateUserPermissions(userData.roles, userData.tenantId),
      lastLogin: '',
      isActive: true,
      mfaEnabled: false,
      createdAt: new Date().toISOString()
    };

    this.users.set(user.id, user);

    // Audit log
    await this.logAuditEvent({
      userId: 'system',
      tenantId: userData.tenantId,
      action: 'user_created',
      resource: `user:${user.id}`,
      details: { username: user.username, email: user.email },
      ipAddress: '',
      userAgent: '',
      severity: 'info',
      compliant: true
    });

    this.emit('user:created', user);
    return user;
  }

  public async authenticateUser(username: string, password: string, tenantId: string): Promise<{
    user: User;
    token: string;
    refreshToken: string;
  }> {
    const user = Array.from(this.users.values()).find(u => 
      u.username === username && u.tenantId === tenantId && u.isActive
    );

    if (!user) {
      await this.logAuditEvent({
        userId: 'unknown',
        tenantId,
        action: 'login_failed',
        resource: `user:${username}`,
        details: { reason: 'user_not_found' },
        ipAddress: '',
        userAgent: '',
        severity: 'warn',
        compliant: false
      });
      throw new Error('Invalid credentials');
    }

    // Check MFA requirement
    if (!user.mfaEnabled) {
      const mfaPolicy = Array.from(this.policies.values()).find(p => 
        p.name === 'Multi-Factor Authentication' && p.enabled
      );
      if (mfaPolicy) {
        throw new Error('Multi-factor authentication required');
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        tenantId: user.tenantId,
        roles: user.roles,
        permissions: user.permissions
      },
      this.jwtSecret,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, tenantId: user.tenantId },
      this.jwtSecret,
      { expiresIn: '7d' }
    );

    // Update last login
    user.lastLogin = new Date().toISOString();
    this.users.set(user.id, user);

    await this.logAuditEvent({
      userId: user.id,
      tenantId,
      action: 'login_success',
      resource: `user:${user.id}`,
      details: { username: user.username },
      ipAddress: '',
      userAgent: '',
      severity: 'info',
      compliant: true
    });

    return { user, token, refreshToken };
  }

  private async validatePasswordPolicy(password: string): Promise<void> {
    const passwordPolicy = Array.from(this.policies.values()).find(p => 
      p.name === 'Strong Password Policy' && p.enabled
    );

    if (!passwordPolicy) return;

    const rule = passwordPolicy.rules[0];
    const params = rule.parameters;

    if (password.length < params.minLength) {
      throw new Error(`Password must be at least ${params.minLength} characters long`);
    }

    if (params.requireUppercase && !/[A-Z]/.test(password)) {
      throw new Error('Password must contain at least one uppercase letter');
    }

    if (params.requireLowercase && !/[a-z]/.test(password)) {
      throw new Error('Password must contain at least one lowercase letter');
    }

    if (params.requireNumbers && !/\d/.test(password)) {
      throw new Error('Password must contain at least one number');
    }

    if (params.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      throw new Error('Password must contain at least one special character');
    }
  }

  // Role-Based Access Control (RBAC)
  public async createRole(roleData: {
    name: string;
    description: string;
    permissions: string[];
    tenantId: string;
  }): Promise<Role> {
    const role: Role = {
      id: uuidv4(),
      name: roleData.name,
      description: roleData.description,
      permissions: roleData.permissions,
      tenantId: roleData.tenantId,
      isSystem: false,
      createdAt: new Date().toISOString()
    };

    this.roles.set(role.id, role);

    await this.logAuditEvent({
      userId: 'system',
      tenantId: roleData.tenantId,
      action: 'role_created',
      resource: `role:${role.id}`,
      details: { name: role.name, permissions: role.permissions },
      ipAddress: '',
      userAgent: '',
      severity: 'info',
      compliant: true
    });

    return role;
  }

  public async checkPermission(userId: string, permission: string, resource?: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user || !user.isActive) {
      return false;
    }

    // Check if user has the required permission
    const hasPermission = user.permissions.includes(permission) || 
                         user.permissions.includes('*') ||
                         user.roles.includes('admin');

    await this.logAuditEvent({
      userId,
      tenantId: user.tenantId,
      action: 'permission_check',
      resource: resource || 'unknown',
      details: { permission, granted: hasPermission },
      ipAddress: '',
      userAgent: '',
      severity: 'info',
      compliant: hasPermission
    });

    return hasPermission;
  }

  private async calculateUserPermissions(roleIds: string[], tenantId: string): Promise<string[]> {
    const permissions = new Set<string>();
    
    for (const roleId of roleIds) {
      const role = this.roles.get(roleId);
      if (role && role.tenantId === tenantId) {
        role.permissions.forEach(permission => permissions.add(permission));
      }
    }

    return Array.from(permissions);
  }

  // Audit Logging
  private async logAuditEvent(event: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
    const auditLog: AuditLog = {
      id: uuidv4(),
      ...event,
      timestamp: new Date().toISOString()
    };

    this.auditLogger.log(auditLog.severity, 'Audit Event', auditLog);
    this.emit('audit:logged', auditLog);
  }

  // Data Encryption
  public encryptSensitiveData(data: string): string {
    const cipher = crypto.createCipher('aes-256-gcm', this.encryptionKey);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  public decryptSensitiveData(encryptedData: string): string {
    const decipher = crypto.createDecipher('aes-256-gcm', this.encryptionKey);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  // Compliance Reporting
  public async generateComplianceReport(tenantId: string, framework: 'soc2' | 'pci-dss' | 'gdpr' | 'hipaa'): Promise<ComplianceReport> {
    const findings = await this.assessCompliance(tenantId, framework);
    const score = this.calculateComplianceScore(findings);
    const status = this.determineComplianceStatus(score);
    const recommendations = this.generateRecommendations(findings);

    const report: ComplianceReport = {
      id: uuidv4(),
      tenantId,
      framework,
      status,
      score,
      findings,
      recommendations,
      generatedAt: new Date().toISOString(),
      validUntil: moment().add(1, 'year').toISOString()
    };

    await this.logAuditEvent({
      userId: 'system',
      tenantId,
      action: 'compliance_report_generated',
      resource: `compliance:${framework}`,
      details: { score, status, findingsCount: findings.length },
      ipAddress: '',
      userAgent: '',
      severity: 'info',
      compliant: true
    });

    return report;
  }

  private async assessCompliance(tenantId: string, framework: string): Promise<ComplianceFinding[]> {
    const findings: ComplianceFinding[] = [];

    // Example compliance checks for SOC2
    if (framework === 'soc2') {
      // Check access controls
      const users = Array.from(this.users.values()).filter(u => u.tenantId === tenantId);
      const usersWithoutMFA = users.filter(u => !u.mfaEnabled);
      
      if (usersWithoutMFA.length > 0) {
        findings.push({
          id: uuidv4(),
          control: 'CC6.1 - Access Controls',
          status: 'fail',
          description: 'Users without multi-factor authentication detected',
          evidence: [`${usersWithoutMFA.length} users without MFA`],
          remediation: 'Enable MFA for all users',
          risk: 'high'
        });
      }

      // Check encryption
      const encryptionPolicy = Array.from(this.policies.values()).find(p => 
        p.name === 'Data Encryption' && p.enabled
      );
      
      if (encryptionPolicy) {
        findings.push({
          id: uuidv4(),
          control: 'CC6.7 - Data Encryption',
          status: 'pass',
          description: 'Data encryption policy is active',
          evidence: ['AES-256-GCM encryption enabled'],
          remediation: 'Continue current encryption practices',
          risk: 'low'
        });
      }
    }

    return findings;
  }

  private calculateComplianceScore(findings: ComplianceFinding[]): number {
    if (findings.length === 0) return 100;

    const passedFindings = findings.filter(f => f.status === 'pass').length;
    return Math.round((passedFindings / findings.length) * 100);
  }

  private determineComplianceStatus(score: number): 'compliant' | 'non-compliant' | 'partial' {
    if (score >= 95) return 'compliant';
    if (score >= 80) return 'partial';
    return 'non-compliant';
  }

  private generateRecommendations(findings: ComplianceFinding[]): string[] {
    const recommendations = [];
    const failedFindings = findings.filter(f => f.status === 'fail');

    if (failedFindings.length > 0) {
      recommendations.push('Address all failed compliance controls');
      recommendations.push('Implement remediation plans for high-risk findings');
    }

    const warningFindings = findings.filter(f => f.status === 'warning');
    if (warningFindings.length > 0) {
      recommendations.push('Review and address warning-level findings');
    }

    recommendations.push('Schedule regular compliance assessments');
    recommendations.push('Maintain documentation for all security controls');

    return recommendations;
  }

  // Multi-tenancy support
  public async createTenant(tenantData: {
    name: string;
    domain: string;
    adminUser: {
      username: string;
      email: string;
      password: string;
    };
  }): Promise<{ tenantId: string; adminUser: User }> {
    const tenantId = uuidv4();

    // Create admin role for tenant
    const adminRole = await this.createRole({
      name: 'admin',
      description: 'Tenant administrator',
      permissions: ['*'],
      tenantId
    });

    // Create admin user
    const adminUser = await this.createUser({
      username: tenantData.adminUser.username,
      email: tenantData.adminUser.email,
      password: tenantData.adminUser.password,
      roles: [adminRole.id],
      tenantId
    });

    await this.logAuditEvent({
      userId: 'system',
      tenantId,
      action: 'tenant_created',
      resource: `tenant:${tenantId}`,
      details: { name: tenantData.name, domain: tenantData.domain },
      ipAddress: '',
      userAgent: '',
      severity: 'info',
      compliant: true
    });

    return { tenantId, adminUser };
  }

  // Getters for management
  public getUsers(tenantId: string): User[] {
    return Array.from(this.users.values()).filter(u => u.tenantId === tenantId);
  }

  public getRoles(tenantId: string): Role[] {
    return Array.from(this.roles.values()).filter(r => r.tenantId === tenantId);
  }

  public getPolicies(): SecurityPolicy[] {
    return Array.from(this.policies.values());
  }
}

// Export factory function
export function createSecurityManager(config: {
  encryptionKey: string;
  jwtSecret: string;
  auditLogPath: string;
}): SecurityManager {
  return new SecurityManager(config);
}