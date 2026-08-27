import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
  Divider,
  ButtonBase,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/constants/routes';
import { DEMO_PASSWORD, users } from '@/services/mockData';
import { USE_DEMO_DATA } from '@/services/firebase/config';
import type { AppUser } from '@/types';

const schema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

type FormValues = z.infer<typeof schema>;

const roleHome: Record<AppUser['role'], string> = {
  doctor: ROUTES.doctorDashboard,
  patient: ROUTES.patientDashboard,
  admin: ROUTES.adminDashboard,
};

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    setSubmitting(true);
    try {
      const user = await login(values.email, values.password);
      const from = (location.state as { from?: Location })?.from?.pathname;
      navigate(from ?? roleHome[user.role], { replace: true });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Unable to sign in. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemoAccount = (email: string) => {
    setValue('email', email);
    setValue('password', DEMO_PASSWORD);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Paper variant="outlined" sx={{ width: '100%', maxWidth: 400, p: { xs: 3, sm: 4 } }}>
        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 3 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '7px',
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Typography sx={{ color: 'primary.contrastText', fontWeight: 700, fontSize: 16 }}>M</Typography>
          </Box>
          <Box>
            <Typography variant="h5">MediTrace</Typography>
            <Typography variant="caption">Longitudinal patient record platform</Typography>
          </Box>
        </Stack>

        <Typography variant="h4" sx={{ mb: 0.5 }}>
          Sign in
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Access your organization's clinical records securely.
        </Typography>

        {serverError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {serverError}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Stack spacing={2}>
            <TextField
              label="Email address"
              type="email"
              autoComplete="email"
              fullWidth
              error={Boolean(errors.email)}
              helperText={errors.email?.message}
              {...register('email')}
            />
            <TextField
              label="Password"
              type="password"
              autoComplete="current-password"
              fullWidth
              error={Boolean(errors.password)}
              helperText={errors.password?.message}
              {...register('password')}
            />
            <Button type="submit" variant="contained" size="large" disabled={submitting} fullWidth>
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </Stack>
        </Box>

        {USE_DEMO_DATA && (
          <>
            <Divider sx={{ my: 3 }}>
              <Typography variant="caption">Demo accounts</Typography>
            </Divider>
            <Stack spacing={1}>
              {users.map((u) => (
                <ButtonBase
                  key={u.userId}
                  onClick={() => fillDemoAccount(u.email)}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    px: 1.5,
                    py: 1,
                    borderRadius: 1.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    textAlign: 'left',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {u.name}
                    </Typography>
                    <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>
                      {u.role}
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ alignSelf: 'center' }}>
                    Use
                  </Typography>
                </ButtonBase>
              ))}
            </Stack>
            <Typography variant="caption" sx={{ display: 'block', mt: 1.5 }}>
              Demo password for every account: <strong>{DEMO_PASSWORD}</strong>
            </Typography>
          </>
        )}
      </Paper>
    </Box>
  );
}
