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

  return {
    sendWelcomeEmail,
    sendPasswordResetEmail,
    sendConfirmationEmail,
  };
};