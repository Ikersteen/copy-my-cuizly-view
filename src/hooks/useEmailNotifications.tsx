import { supabase } from "@/integrations/supabase/client";

interface EmailNotificationParams {
  email: string;
  userName: string;
  userType: 'consumer' | 'restaurant_owner';
}

interface PasswordResetParams {
  email: string;
  resetUrl: string;
  userName?: string;
}

interface ConfirmationEmailParams {
  email: string;
  confirmationUrl: string;
  userName: string;
  userType: 'consumer' | 'restaurant_owner';
}

export const useEmailNotifications = () => {
  const sendWelcomeEmail = async ({ email, userName, userType }: EmailNotificationParams) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-welcome-email', {
        body: {
          email,
          userName,
          userType,
        },
      });

      if (error) {
        console.error('Error sending welcome email:', error);
        return { success: false, error };
      }

      console.log('Welcome email sent successfully:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Error invoking welcome email function:', error);
      return { success: false, error };
    }
  };

  const sendPasswordResetEmail = async ({ email, resetUrl, userName }: PasswordResetParams) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-password-reset', {
        body: {
          email,
          resetUrl,
          userName,
        },
      });

      if (error) {
        console.error('Error sending password reset email:', error);
        return { success: false, error };
      }

      console.log('Password reset email sent successfully:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Error invoking password reset email function:', error);
      return { success: false, error };
    }
  };

  const sendConfirmationEmail = async ({ email, confirmationUrl, userName, userType }: ConfirmationEmailParams) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-confirmation-email', {
        body: {
          email,
          confirmationUrl,
          userName,
          userType,
        },
      });

      if (error) {
        console.error('Error sending confirmation email:', error);
        return { success: false, error };
      }

      console.log('Confirmation email sent successfully:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Error invoking confirmation email function:', error);
      return { success: false, error };
    }
  };

  const sendMagicLinkEmail = async ({ email, loginUrl, userName }: { email: string; loginUrl: string; userName?: string }) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-magic-link', {
        body: {
          email,
          loginUrl,
          userName,
        },
      });

      if (error) {
        console.error('Error sending magic link email:', error);
        return { success: false, error };
      }

      console.log('Magic link email sent successfully:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Error invoking magic link email function:', error);
      return { success: false, error };
    }
  };

  const sendEmailChangeEmail = async ({ 
    email, 
    confirmationUrl, 
    userName, 
    newEmail, 
    oldEmail 
  }: { 
    email: string; 
    confirmationUrl: string; 
    userName: string; 
    newEmail: string; 
    oldEmail: string; 
  }) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-email-change', {
        body: {
          email,
          confirmationUrl,
          userName,
          newEmail,
          oldEmail,
        },
      });

      if (error) {
        console.error('Error sending email change confirmation:', error);
        return { success: false, error };
      }

      console.log('Email change confirmation sent successfully:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Error invoking email change function:', error);
      return { success: false, error };
    }
  };

  const sendReauthenticationEmail = async ({ 
    email, 
    confirmationUrl, 
    userName, 
    actionDescription 
  }: { 
    email: string; 
    confirmationUrl: string; 
    userName: string; 
    actionDescription: string; 
  }) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-reauthentication', {
        body: {
          email,
          confirmationUrl,
          userName,
          actionDescription,
        },
      });

      if (error) {
        console.error('Error sending reauthentication email:', error);
        return { success: false, error };
      }

      console.log('Reauthentication email sent successfully:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Error invoking reauthentication email function:', error);
      return { success: false, error };
    }
  };

  const sendUserInvitationEmail = async ({ 
    email, 
    invitationUrl, 
    inviterName, 
    inviteeName, 
    userType, 
    customMessage 
  }: { 
    email: string; 
    invitationUrl: string; 
    inviterName: string; 
    inviteeName: string; 
    userType: 'consumer' | 'restaurant_owner'; 
    customMessage?: string; 
  }) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-user-invitation', {
        body: {
          email,
          invitationUrl,
          inviterName,
          inviteeName,
          userType,
          customMessage,
        },
      });

      if (error) {
        console.error('Error sending user invitation email:', error);
        return { success: false, error };
      }

      console.log('User invitation email sent successfully:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Error invoking user invitation email function:', error);
      return { success: false, error };
    }
  };

  return {
    sendWelcomeEmail,
    sendPasswordResetEmail,
    sendConfirmationEmail,
    sendMagicLinkEmail,
    sendEmailChangeEmail,
    sendReauthenticationEmail,
    sendUserInvitationEmail,
  };
};