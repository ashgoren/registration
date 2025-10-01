import { useState } from 'react';
import { google, ics } from 'calendar-link';
import { Button, Menu, MenuItem } from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import userConfig from 'config/configEvent.jsx';
const { calendar } = userConfig;

const event = {
  title: calendar.title,
  description: calendar.description,
  location: calendar.location,
  start: new Date(calendar.start),
  end: new Date(calendar.end),
};

export const CalendarLinks = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const isOpen = Boolean(anchorEl);

  const handleOpen = (e) => {
    setAnchorEl(e.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <Button
        variant='outlined'
        startIcon={<CalendarTodayIcon />}
        endIcon={
          <KeyboardArrowDownIcon 
            sx={{ 
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s'
            }} 
          />
        }
        onClick={handleOpen}
        aria-controls={isOpen ? 'calendar-menu' : undefined}
        aria-haspopup='true'
        aria-expanded={isOpen ? 'true' : undefined}
      >
        Add to calendar
      </Button>
      
      <Menu
        id='calendar-menu'
        anchorEl={anchorEl}
        open={isOpen}
        onClose={handleClose}
      >
        <MenuItem 
          component='a' 
          href={ics(event)} 
          download={`${event.title}.ics`}
          onClick={handleClose}
        >
          Apple Calendar
        </MenuItem>
        <MenuItem 
          component='a' 
          href={google(event)} 
          target='_blank' 
          rel='noopener noreferrer'
          onClick={handleClose}
        >
          Google Calendar
        </MenuItem>
      </Menu>
    </>
  );
};
