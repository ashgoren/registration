import { useState } from 'react';
import { google, ics } from 'calendar-link';
import { Button, Menu, MenuItem } from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { config } from 'config';
import type { MouseEvent } from 'react';

const event = {
  title: config.calendar.title,
  description: config.calendar.description,
  location: config.calendar.location,
  start: new Date(config.calendar.start),
  end: new Date(config.calendar.end),
};

export const CalendarLinks = () => {
  const [anchorEl, setAnchorEl] = useState<(null | HTMLElement)>(null);
  const isOpen = Boolean(anchorEl);

  const handleOpen = (e: MouseEvent<HTMLButtonElement>) => {
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
