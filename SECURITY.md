# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1   | :x:                |

## Reporting a Vulnerability

The CodeGraph team takes security bugs seriously. We appreciate your efforts to responsibly disclose your findings.

### Where to Report

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to:

**security@codegraph.dev** (replace with your actual security contact)

If you prefer encrypted communication, you can use our PGP key:
```
[Your PGP key fingerprint here]
```

### What to Include

To help us triage and respond quickly, please include:

1. **Type of vulnerability** (e.g., XSS, SQL injection, authentication bypass)
2. **Full paths** of source file(s) related to the vulnerability
3. **Location** of the affected source code (tag/branch/commit or direct URL)
4. **Step-by-step instructions** to reproduce the issue
5. **Proof-of-concept or exploit code** (if possible)
6. **Impact** of the vulnerability
7. **Any potential mitigations** you've identified

### What to Expect

- **Acknowledgment**: We'll acknowledge receipt of your report within 48 hours
- **Assessment**: We'll assess the vulnerability and determine severity within 7 days
- **Updates**: We'll keep you informed of our progress every 7 days
- **Resolution**: We aim to release a fix within 90 days
- **Credit**: We'll credit you in our security advisory (unless you prefer anonymity)

### Disclosure Policy

- **Private Disclosure**: We ask that you keep the vulnerability confidential until we've released a fix
- **Coordinated Disclosure**: We'll work with you to disclose the vulnerability responsibly
- **Public Disclosure**: We'll publish a security advisory once a fix is available
- **CVE**: We'll request a CVE for significant vulnerabilities

## Security Best Practices

### For Users

If you're deploying CodeGraph, follow these security best practices:

#### Environment Variables
- **Never commit secrets** to version control
- Use **strong, unique passwords** for all services
- **Rotate API keys** regularly
- Store secrets in a **secure vault** (e.g., AWS Secrets Manager, HashiCorp Vault)

#### Network Security
- Deploy behind a **reverse proxy** with SSL/TLS
- Use **strong TLS configurations** (TLS 1.2+)
- Implement **rate limiting** on all endpoints
- Configure **CORS** appropriately for your domain

#### Database Security
- Use **strong database passwords**
- Enable **SSL/TLS** for database connections
- **Limit database access** to application servers only
- Enable **query logging** for audit trails
- Regular **database backups** with encryption

#### Authentication
- Enforce **strong password policies** (12+ characters, complexity)
- Implement **account lockout** after failed login attempts
- Use **secure session management** with HttpOnly cookies
- Enable **two-factor authentication** (when implemented)
- Set appropriate **JWT expiration times** (15-30 minutes for access tokens)

#### Container Security
- **Don't run containers as root**
- Use **minimal base images** (e.g., Alpine Linux)
- **Scan images** for vulnerabilities regularly
- **Pin dependency versions** in Dockerfiles
- **Update base images** regularly

#### Code Execution
- **Sandbox all code execution** in isolated containers
- Implement **resource limits** (CPU, memory, time)
- **Restrict network access** from execution environments
- **Validate all user input** before execution
- **Log all executions** with full context

#### Agent Security
- **Validate all agent outputs** before applying changes
- Implement **human approval gates** for critical operations
- **Limit agent permissions** to minimum required
- **Audit all agent actions** with full traceability
- **Rate limit** agent API calls to prevent abuse

### For Developers

#### Input Validation
```python
# Good: Validate all inputs
from pydantic import BaseModel, validator

class TaskCreate(BaseModel):
    title: str
    description: str
    
    @validator('title')
    def title_must_be_reasonable(cls, v):
        if len(v) > 200:
            raise ValueError('Title too long')
        return v
```

#### SQL Injection Prevention
```python
# Good: Use parameterized queries (SQLAlchemy does this)
result = await db.execute(
    select(Task).where(Task.id == task_id)
)

# Bad: Never use string formatting for SQL
# query = f"SELECT * FROM tasks WHERE id = {task_id}"  # DON'T DO THIS
```

#### Authentication
```python
# Good: Always verify user ownership
async def get_task(task_id: int, current_user: User):
    task = await db.get(Task, task_id)
    if task.user_id != current_user.id:
        raise HTTPException(status_code=403)
    return task
```

#### XSS Prevention
```typescript
// Good: React automatically escapes content
<div>{task.description}</div>

// Bad: Avoid dangerouslySetInnerHTML
// <div dangerouslySetInnerHTML={{ __html: task.description }} />
```

#### API Keys
```python
# Good: Use environment variables
from src.core.config import settings
api_key = settings.ANTHROPIC_API_KEY

# Bad: Never hardcode keys
# api_key = "sk-ant-api03-..."  # DON'T DO THIS
```

## Security Features

### Current Implementation

- ✅ **JWT-based authentication** with secure token storage
- ✅ **Password hashing** with bcrypt
- ✅ **Input validation** with Pydantic
- ✅ **SQL injection protection** via SQLAlchemy
- ✅ **CORS configuration** for API security
- ✅ **Rate limiting** on agent operations
- ✅ **Structured logging** for audit trails
- ✅ **Environment-based configuration**

### Planned Features

- 🔄 **Two-factor authentication** (2FA)
- 🔄 **API key management** with scopes
- 🔄 **Role-based access control** (RBAC)
- 🔄 **Audit logging** with retention policies
- 🔄 **Automated security scanning** in CI/CD
- 🔄 **Content Security Policy** (CSP) headers
- 🔄 **Secrets scanning** in commits
- 🔄 **Dependency vulnerability scanning**

## Known Security Limitations

### Code Execution Risks

CodeGraph executes AI-generated code. While we implement sandboxing and resource limits, users should:

- **Review generated code** before execution in production
- **Test in isolated environments** first
- **Implement additional controls** based on your risk tolerance
- **Monitor execution** for unexpected behavior

### LLM-Specific Risks

AI models can:

- **Generate insecure code** despite best efforts
- **Be susceptible to prompt injection** attacks
- **Leak training data** in rare cases
- **Produce biased outputs**

We mitigate these through:
- Code review agent that checks for security issues
- Input validation on all prompts
- Output validation before execution
- Human-in-the-loop for critical operations

### Third-Party Dependencies

We depend on:
- **Anthropic API** for LLM capabilities
- **GitHub API** for repository access
- **Various npm/pip packages**

We mitigate risks through:
- Regular dependency updates
- Automated vulnerability scanning
- Pinned dependency versions
- Security advisories monitoring

## Security Updates

We publish security updates through:

1. **GitHub Security Advisories** - https://github.com/yourusername/codegraph/security/advisories
2. **Release Notes** - Tagged with `[SECURITY]`
3. **Email Notifications** - For critical vulnerabilities (subscribe in Discussions)

## Compliance

CodeGraph is designed to help you maintain compliance with:

- **GDPR**: User data control and deletion
- **SOC 2**: Audit logging and access controls
- **ISO 27001**: Information security management

However, users are responsible for their own compliance requirements.

## Security Checklist for Production

Before deploying CodeGraph to production:

- [ ] Change all default passwords and secrets
- [ ] Enable HTTPS with valid SSL certificates
- [ ] Configure firewall rules (allow only necessary ports)
- [ ] Set up database encryption at rest
- [ ] Enable database connection encryption (SSL)
- [ ] Configure regular automated backups
- [ ] Implement monitoring and alerting
- [ ] Set up log aggregation and retention
- [ ] Configure rate limiting on all endpoints
- [ ] Review and restrict CORS settings
- [ ] Disable debug mode and verbose logging
- [ ] Set secure session configurations
- [ ] Implement IP whitelisting (if applicable)
- [ ] Enable container security scanning
- [ ] Set up intrusion detection (IDS)
- [ ] Configure security headers (CSP, HSTS, etc.)
- [ ] Document incident response procedures
- [ ] Set up automated security updates
- [ ] Conduct security assessment/penetration testing

## Bug Bounty Program

We currently do not have a formal bug bounty program, but we deeply appreciate security researchers who responsibly disclose vulnerabilities. We're happy to:

- Publicly acknowledge your contribution
- Provide swag/merchandise (when available)
- Give you early access to new features

## Contact

For security concerns, contact:
- **Email**: security@codegraph.dev
- **Maintainers**: @yourname (GitHub)

For general questions:
- **GitHub Discussions**: https://github.com/yourusername/codegraph/discussions
- **Twitter**: @codegraph

## Acknowledgments

We'd like to thank the following security researchers for responsibly disclosing vulnerabilities:

- [Your name here]

---

**Last updated**: December 2024

Thank you for helping keep CodeGraph and our users safe! 🔒