# ✅ Deployment Checklist

## Pre-Deployment

### Server Requirements
- [ ] PHP 8.1+ installed
- [ ] PHP Extensions: dom, curl, mbstring, pdo_mysql, zip, gd, bcmath, opcache
- [ ] MySQL/MariaDB installed
- [ ] Node.js 18+ installed
- [ ] Composer installed
- [ ] Web server (Nginx/Apache) configured

### aaPanel Setup
- [ ] Website created with correct domain
- [ ] Run Directory set to `/public`
- [ ] PHP version set to 8.1+
- [ ] SSL certificate installed (optional)
- [ ] Database created
- [ ] Database user created with permissions

### Project Files
- [ ] Project uploaded to server
- [ ] `.env` file created from `.env.example`
- [ ] Database credentials configured in `.env`
- [ ] `APP_URL` set correctly in `.env`
- [ ] `APP_ENV` set to `production`
- [ ] `APP_DEBUG` set to `false`

## Deployment Steps

### 1. Build Frontend
- [ ] `cd frontend`
- [ ] `npm install` completed
- [ ] `npm run build` completed
- [ ] `public/app/index.html` exists
- [ ] `public/app/assets/` directory exists

### 2. Laravel Setup
- [ ] `composer install --optimize-autoloader --no-dev` completed
- [ ] `php artisan key:generate` completed (if needed)
- [ ] `php artisan migrate --force` completed
- [ ] `php artisan db:seed --force` completed
- [ ] `php artisan storage:link` completed

### 3. Optimization
- [ ] `php artisan config:cache` completed
- [ ] `php artisan route:cache` completed
- [ ] `php artisan view:cache` completed

### 4. Permissions
- [ ] `chmod -R 755 .` completed
- [ ] `chmod -R 775 storage bootstrap/cache` completed
- [ ] `chown -R www:www .` completed

## Post-Deployment Verification

### File Structure
- [ ] `public/app/index.html` exists
- [ ] `public/storage` symlink exists
- [ ] `storage/logs/` is writable
- [ ] `bootstrap/cache/` is writable

### Application Tests
- [ ] Website loads (no Laravel default page)
- [ ] Frontend React app displays
- [ ] Login page accessible
- [ ] Can login with default credentials
- [ ] API endpoints respond correctly
- [ ] Database connection working

### Security
- [ ] `.env` file not accessible via web
- [ ] `APP_DEBUG=false` in production
- [ ] Default admin password changed
- [ ] SSL certificate active (if applicable)

### Performance
- [ ] Opcache enabled
- [ ] Config cached
- [ ] Routes cached
- [ ] Views cached

## Troubleshooting

If something doesn't work:
- [ ] Check `storage/logs/laravel.log`
- [ ] Check web server error logs
- [ ] Verify permissions
- [ ] Clear all caches: `php artisan optimize:clear`
- [ ] Rebuild frontend: `cd frontend && npm run build`

## Rollback Plan

In case of critical issues:
- [ ] Backup database before deployment
- [ ] Keep previous version files
- [ ] Document rollback steps
- [ ] Test rollback procedure

## Monitoring

After deployment:
- [ ] Monitor error logs for 24 hours
- [ ] Check application performance
- [ ] Verify all features working
- [ ] Test user workflows
- [ ] Monitor server resources

## Documentation

- [ ] Update deployment date in docs
- [ ] Document any custom configurations
- [ ] Update changelog
- [ ] Notify team of deployment

---

## Quick Commands Reference

```bash
# Full deployment
bash deploy-simple.sh

# Clear all caches
php artisan optimize:clear

# Re-optimize
php artisan optimize

# Check logs
tail -f storage/logs/laravel.log

# Rebuild frontend
cd frontend && npm run build && cd ..

# Fix permissions
chmod -R 775 storage bootstrap/cache
sudo chown -R www:www .
```

## Emergency Contacts

- Server Admin: [contact]
- Database Admin: [contact]
- Developer: [contact]

---

**Last Updated**: [Date]
**Deployed By**: [Name]
**Deployment Status**: [ ] Success / [ ] Failed / [ ] Rolled Back
