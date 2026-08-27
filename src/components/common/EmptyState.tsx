import { Box, Typography } from '@mui/material';
import type { SvgIconComponent } from '@mui/icons-material';

interface EmptyStateProps {
  icon: SvgIconComponent;
  title: string;
  description: string;
}

/** Consistent empty state used instead of blank screens or fabricated data. */
export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <Box sx={{ textAlign: 'center', py: 6, px: 2 }}>
      <Icon sx={{ fontSize: 32, color: 'text.secondary', mb: 1.5 }} />
      <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360, mx: 'auto' }}>
        {description}
      </Typography>
    </Box>
  );
}
