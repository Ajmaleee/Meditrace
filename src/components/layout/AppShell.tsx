import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useAuth } from '@/context/AuthContext';
import { NAV_ITEMS } from '@/components/layout/navConfig';
import { ROUTES } from '@/constants/routes';
import { organizations } from '@/services/mockData';

const DRAWER_WIDTH = 240;

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  if (!user) return null;

  const navItems = NAV_ITEMS[user.role];
  const organization = organizations.find((o) => o.organizationId === user.organizationId);

  const handleLogout = async () => {
    setMenuAnchor(null);
    await logout();
    navigate(ROUTES.login);
  };

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar sx={{ gap: 1, px: 2.5 }}>
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: '6px',
            bgcolor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Typography sx={{ color: 'primary.contrastText', fontWeight: 700, fontSize: 14 }}>M</Typography>
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.01em' }}>
          MediTrace
        </Typography>
      </Toolbar>
      <Divider />
      <List sx={{ px: 1.5, py: 1, flexGrow: 1 }}>
        {navItems.map((item) => {
          const selected = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          const Icon = item.icon;
          return (
            <ListItemButton
              key={item.label}
              selected={selected}
              onClick={() => {
                navigate(item.path);
                setMobileOpen(false);
              }}
              sx={{
                borderRadius: 1.5,
                mb: 0.5,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': { bgcolor: 'primary.dark' },
                  '& .MuiListItemIcon-root': { color: 'primary.contrastText' },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Icon fontSize="small" />
              </ListItemIcon>
              <ListItemText primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }}>
                {item.label}
              </ListItemText>
            </ListItemButton>
          );
        })}
      </List>
      <Box sx={{ px: 2.5, py: 2 }}>
        <Divider sx={{ mb: 1.5 }} />
        <Typography variant="caption" sx={{ display: 'block' }}>
          Demo prototype — synthetic data only
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <Box
        component="a"
        href="#main-content"
        sx={{
          position: 'absolute',
          left: -9999,
          top: 0,
          zIndex: 2000,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          px: 2,
          py: 1,
          borderRadius: 1,
          '&:focus': { left: 16, top: 16 },
        }}
      >
        Skip to main content
      </Box>
      <AppBar
        position="fixed"
        sx={{ width: { md: `calc(100% - ${DRAWER_WIDTH}px)` }, ml: { md: `${DRAWER_WIDTH}px` } }}
      >
        <Toolbar sx={{ gap: 2 }}>
          <IconButton
            edge="start"
            onClick={() => setMobileOpen(true)}
            sx={{ display: { md: 'none' } }}
            aria-label="Open navigation"
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            {organization && (
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {organization.name}
              </Typography>
            )}
          </Box>
          <Box
            onClick={(e) => setMenuAnchor(e.currentTarget)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setMenuAnchor(e.currentTarget as unknown as HTMLElement);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={`Account menu for ${user.name}`}
            sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', py: 0.5, px: 1, borderRadius: 1.5, '&:hover': { bgcolor: 'action.hover' } }}
            aria-haspopup="true"
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main', fontSize: 14 }}>
              {user.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
            </Avatar>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                {user.name}
              </Typography>
              <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>
                {user.role}
              </Typography>
            </Box>
            <KeyboardArrowDownIcon fontSize="small" sx={{ color: 'text.secondary' }} />
          </Box>
          <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
            <MenuItem onClick={handleLogout}>
              <LogoutOutlinedIcon fontSize="small" sx={{ mr: 1.5 }} />
              Sign out
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' } }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box
        component="main"
        id="main-content"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          bgcolor: 'background.default',
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1200, mx: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
