import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Lock, Mail, Phone, Shield, Eye, EyeOff } from 'lucide-react';
import { useAccountSettings } from '@/hooks/useAccountSettings';
import { useTranslation } from 'react-i18next';

interface AccountSettingsSectionProps {
  currentEmail?: string;
  currentPhone?: string;
  onSuccess?: () => void;
}

export const AccountSettingsSection = ({ 
  currentEmail, 
  currentPhone,
  onSuccess 
}: AccountSettingsSectionProps) => {
  const { t } = useTranslation();
  const {
    handlePasswordChange,
    handleEmailChange,
    sendPhoneVerification,
    verifyPhoneCode,
    validatePassword,
    isChangingPassword,
    isChangingEmail,
    isChangingPhone,
    verificationSent,
  } = useAccountSettings();

  // Password change state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Email change state
  const [showEmailSection, setShowEmailSection] = useState(false);
  const [newEmail, setNewEmail] = useState('');

  // Phone change state
  const [showPhoneSection, setShowPhoneSection] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  // Password validation feedback
  const passwordValidation = newPassword ? validatePassword(newPassword) : { isValid: true };

  const handlePasswordSubmit = async () => {
    const result = await handlePasswordChange(currentPassword, newPassword, confirmPassword);
    if (result.success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);
      onSuccess?.();
    }
  };

  const handleEmailSubmit = async () => {
    const result = await handleEmailChange(newEmail);
    if (result.success) {
      setNewEmail('');
      setShowEmailSection(false);
      onSuccess?.();
    }
  };

  const handlePhoneSendCode = async () => {
    await sendPhoneVerification(newPhone);
  };

  const handlePhoneVerify = async () => {
    const result = await verifyPhoneCode(verificationCode);
    if (result.success) {
      setNewPhone('');
      setVerificationCode('');
      setShowPhoneSection(false);
      onSuccess?.();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">{t('profile.accountSettings')}</h3>
        <Alert className="mb-4">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            {t('profile.accountSettingsInfo')}
          </AlertDescription>
        </Alert>
      </div>

      {/* Password Change Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="h-4 w-4" />
            {t('profile.changePassword')}
          </CardTitle>
          <CardDescription>{t('profile.changePasswordDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {!showPasswordSection ? (
            <Button 
              variant="outline" 
              onClick={() => setShowPasswordSection(true)}
              className="w-full sm:w-auto"
            >
              {t('profile.changePassword')}
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">{t('profile.currentPassword')}</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder={t('profile.enterCurrentPassword')}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">{t('profile.newPassword')}</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t('profile.enterNewPassword')}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {newPassword && !passwordValidation.isValid && (
                  <p className="text-sm text-destructive">{passwordValidation.error}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('profile.confirmPassword')}</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('profile.confirmNewPassword')}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  {t('profile.passwordRequirements')}
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button
                  onClick={handlePasswordSubmit}
                  disabled={isChangingPassword || !passwordValidation.isValid}
                >
                  {isChangingPassword ? t('common.saving') : t('profile.updatePassword')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPasswordSection(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                >
                  {t('common.cancel')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Email Change Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="h-4 w-4" />
            {t('profile.changeEmail')}
          </CardTitle>
          <CardDescription>
            {t('profile.currentEmail')}: <span className="font-medium">{currentEmail || t('common.notSet')}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showEmailSection ? (
            <Button 
              variant="outline" 
              onClick={() => setShowEmailSection(true)}
              className="w-full sm:w-auto"
            >
              {t('profile.changeEmail')}
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newEmail">{t('profile.newEmail')}</Label>
                <Input
                  id="newEmail"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder={t('profile.enterNewEmail')}
                />
              </div>

              <Alert>
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  {t('profile.emailVerificationInfo')}
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button
                  onClick={handleEmailSubmit}
                  disabled={isChangingEmail || !newEmail}
                >
                  {isChangingEmail ? t('common.sending') : t('profile.sendVerification')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEmailSection(false);
                    setNewEmail('');
                  }}
                >
                  {t('common.cancel')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Phone Change Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Phone className="h-4 w-4" />
            {t('profile.changePhone')}
          </CardTitle>
          <CardDescription>
            {t('profile.currentPhone')}: <span className="font-medium">{currentPhone || t('common.notSet')}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showPhoneSection ? (
            <Button 
              variant="outline" 
              onClick={() => setShowPhoneSection(true)}
              className="w-full sm:w-auto"
            >
              {t('profile.changePhone')}
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPhone">{t('profile.newPhone')}</Label>
                <Input
                  id="newPhone"
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+1 514 123 4567"
                  disabled={verificationSent}
                />
              </div>

              {!verificationSent ? (
                <div className="flex gap-2">
                  <Button
                    onClick={handlePhoneSendCode}
                    disabled={!newPhone}
                  >
                    {t('profile.sendCode')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPhoneSection(false);
                      setNewPhone('');
                    }}
                  >
                    {t('common.cancel')}
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="verificationCode">{t('profile.verificationCode')}</Label>
                    <Input
                      id="verificationCode"
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="123456"
                      maxLength={6}
                    />
                  </div>

                  <Alert>
                    <Phone className="h-4 w-4" />
                    <AlertDescription>
                      {t('profile.smsVerificationInfo')}
                    </AlertDescription>
                  </Alert>

                  <div className="flex gap-2">
                    <Button
                      onClick={handlePhoneVerify}
                      disabled={isChangingPhone || !verificationCode}
                    >
                      {isChangingPhone ? t('common.verifying') : t('profile.verify')}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowPhoneSection(false);
                        setNewPhone('');
                        setVerificationCode('');
                      }}
                    >
                      {t('common.cancel')}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
