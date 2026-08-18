/* @ds-bundle: {"format":3,"namespace":"ACasaDaLapaDesignSystem_6d5c43","components":[{"name":"BookingWidget","sourcePath":"components/booking/BookingWidget.jsx"},{"name":"Button","sourcePath":"components/buttons/Button.jsx"},{"name":"IconButton","sourcePath":"components/buttons/IconButton.jsx"},{"name":"ExperienceCard","sourcePath":"components/cards/ExperienceCard.jsx"},{"name":"PropertyCard","sourcePath":"components/cards/PropertyCard.jsx"},{"name":"TrailCard","sourcePath":"components/cards/TrailCard.jsx"},{"name":"FaqItem","sourcePath":"components/content/FaqItem.jsx"},{"name":"Highlight","sourcePath":"components/content/Highlight.jsx"},{"name":"Testimonial","sourcePath":"components/content/Testimonial.jsx"},{"name":"Badge","sourcePath":"components/feedback/Badge.jsx"},{"name":"Rating","sourcePath":"components/feedback/Rating.jsx"},{"name":"Tag","sourcePath":"components/feedback/Tag.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"}],"sourceHashes":{"components/booking/BookingWidget.jsx":"ba4936a24da3","components/buttons/Button.jsx":"eef36fee4ab8","components/buttons/IconButton.jsx":"0113b3d53c9a","components/cards/ExperienceCard.jsx":"eded1c26501c","components/cards/PropertyCard.jsx":"db28f78bc489","components/cards/TrailCard.jsx":"7db12439a093","components/content/FaqItem.jsx":"e2c4a92523d1","components/content/Highlight.jsx":"8c34acc9fa2a","components/content/Testimonial.jsx":"08582e4aa325","components/feedback/Badge.jsx":"59b7086a8f10","components/feedback/Rating.jsx":"0775db3ff029","components/feedback/Tag.jsx":"e44f9d745de8","components/forms/Checkbox.jsx":"d0d3681b4bdb","components/forms/Input.jsx":"caeca1f200bb","components/forms/Select.jsx":"1a74c3c2ec25","ui_kits/website/Chrome.jsx":"912f66d71149","ui_kits/website/ExperiencesScreen.jsx":"b2c6a5a4b413","ui_kits/website/HomeScreen.jsx":"2dc98c1d9012","ui_kits/website/HouseScreen.jsx":"ea8561663d9c"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.ACasaDaLapaDesignSystem_6d5c43 = window.ACasaDaLapaDesignSystem_6d5c43 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/buttons/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Casa da Lapa — Button
 * Geometric, architectural CTA. Square-ish corners, calm hover.
 */
function Button({
  variant = 'primary',
  size = 'md',
  uppercase = false,
  fullWidth = false,
  iconLeft = null,
  iconRight = null,
  disabled = false,
  type = 'button',
  onClick,
  children,
  style = {},
  ...rest
}) {
  const sizes = {
    sm: {
      padding: '9px 16px',
      fontSize: '13px'
    },
    md: {
      padding: '13px 24px',
      fontSize: '14.5px'
    },
    lg: {
      padding: '17px 34px',
      fontSize: '16px'
    }
  };
  const variants = {
    primary: {
      background: 'var(--color-brand)',
      color: 'var(--white)',
      border: '1.5px solid var(--color-brand)'
    },
    secondary: {
      background: 'transparent',
      color: 'var(--stone-800)',
      border: '1.5px solid var(--stone-700)'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--terra-600)',
      border: '1.5px solid transparent'
    },
    inverse: {
      background: 'var(--paper)',
      color: 'var(--basalt-900)',
      border: '1.5px solid var(--paper)'
    }
  };
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    width: fullWidth ? '100%' : 'auto',
    fontFamily: 'var(--font-display)',
    fontWeight: 500,
    letterSpacing: uppercase ? '0.12em' : '0.02em',
    textTransform: uppercase ? 'uppercase' : 'none',
    lineHeight: 1,
    borderRadius: 'var(--radius-sm)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1,
    transition: 'background var(--dur-base) var(--ease-out), color var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out), transform var(--dur-fast) var(--ease-out)',
    whiteSpace: 'nowrap',
    ...sizes[size],
    ...variants[variant],
    ...style
  };
  const hoverMap = {
    primary: {
      background: 'var(--color-brand-hover)',
      borderColor: 'var(--color-brand-hover)'
    },
    secondary: {
      background: 'var(--stone-900)',
      color: 'var(--paper)',
      borderColor: 'var(--stone-900)'
    },
    ghost: {
      background: 'var(--terra-50)'
    },
    inverse: {
      background: 'var(--white)'
    }
  };
  const onEnter = e => {
    if (disabled) return;
    Object.assign(e.currentTarget.style, hoverMap[variant]);
  };
  const onLeave = e => {
    if (disabled) return;
    Object.assign(e.currentTarget.style, variants[variant]);
  };
  const onDown = e => {
    if (disabled) return;
    e.currentTarget.style.transform = 'translateY(1px)';
  };
  const onUp = e => {
    if (disabled) return;
    e.currentTarget.style.transform = 'translateY(0)';
  };
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: onEnter,
    onMouseLeave: onLeave,
    onMouseDown: onDown,
    onMouseUp: onUp,
    style: base
  }, rest), iconLeft, children, iconRight);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/buttons/Button.jsx", error: String((e && e.message) || e) }); }

// components/booking/BookingWidget.jsx
try { (() => {
/**
 * Casa da Lapa — BookingWidget
 * Compact availability search: dates, guests, CTA. Card or bar layout.
 */
function BookingWidget({
  layout = 'card',
  price,
  unit = 'night',
  onSearch,
  style = {}
}) {
  const Field = ({
    label,
    value,
    placeholder
  }) => /*#__PURE__*/React.createElement("button", {
    type: "button",
    style: {
      all: 'unset',
      boxSizing: 'border-box',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      padding: '12px 16px',
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: '11px',
      fontWeight: 500,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: 'var(--text-muted)'
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '15px',
      color: value ? 'var(--text-strong)' : 'var(--text-faint)'
    }
  }, value || placeholder));
  const isBar = layout === 'bar';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--color-surface-raised)',
      border: '1px solid var(--border-hairline)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-md)',
      padding: isBar ? 8 : 'var(--space-5)',
      display: 'flex',
      flexDirection: isBar ? 'row' : 'column',
      alignItems: isBar ? 'center' : 'stretch',
      gap: isBar ? 8 : 'var(--space-4)',
      ...style
    }
  }, !isBar && price != null && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 8,
      paddingBottom: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 500,
      fontSize: '26px',
      color: 'var(--text-strong)'
    }
  }, price), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '14px',
      color: 'var(--text-muted)'
    }
  }, "/ ", unit)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flex: isBar ? 1 : 'none',
      border: '1px solid var(--border-soft)',
      borderRadius: 'var(--radius-sm)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Arrival",
    placeholder: "Add date"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 1,
      background: 'var(--border-hairline)',
      alignSelf: 'stretch'
    }
  }), /*#__PURE__*/React.createElement(Field, {
    label: "Departure",
    placeholder: "Add date"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 1,
      background: 'var(--border-hairline)',
      alignSelf: 'stretch'
    }
  }), /*#__PURE__*/React.createElement(Field, {
    label: "Guests",
    value: "2 guests"
  })), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "primary",
    size: isBar ? 'md' : 'lg',
    fullWidth: !isBar,
    onClick: onSearch
  }, "Check availability"));
}
Object.assign(__ds_scope, { BookingWidget });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/booking/BookingWidget.jsx", error: String((e && e.message) || e) }); }

// components/buttons/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Casa da Lapa — IconButton
 * Square, quiet icon control for toolbars, galleries, nav.
 */
function IconButton({
  variant = 'soft',
  size = 'md',
  label,
  disabled = false,
  onClick,
  children,
  style = {},
  ...rest
}) {
  const dims = {
    sm: 34,
    md: 42,
    lg: 50
  };
  const d = dims[size];
  const variants = {
    soft: {
      background: 'var(--white)',
      color: 'var(--stone-700)',
      border: '1px solid var(--border-hairline)'
    },
    solid: {
      background: 'var(--color-brand)',
      color: 'var(--white)',
      border: '1px solid var(--color-brand)'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--stone-700)',
      border: '1px solid transparent'
    },
    glass: {
      background: 'rgba(255,255,255,0.16)',
      color: 'var(--white)',
      border: '1px solid rgba(255,255,255,0.28)',
      backdropFilter: 'blur(8px)'
    }
  };
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: d,
    height: d,
    borderRadius: 'var(--radius-sm)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1,
    transition: 'background var(--dur-base) var(--ease-out), color var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out)',
    ...variants[variant],
    ...style
  };
  const hoverMap = {
    soft: {
      background: 'var(--stone-100)'
    },
    solid: {
      background: 'var(--color-brand-hover)'
    },
    ghost: {
      background: 'var(--stone-100)'
    },
    glass: {
      background: 'rgba(255,255,255,0.28)'
    }
  };
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "aria-label": label,
    title: label,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: e => {
      if (!disabled) Object.assign(e.currentTarget.style, hoverMap[variant]);
    },
    onMouseLeave: e => {
      if (!disabled) Object.assign(e.currentTarget.style, variants[variant]);
    },
    style: base
  }, rest), children);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/buttons/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/cards/ExperienceCard.jsx
try { (() => {
/**
 * Casa da Lapa — ExperienceCard
 * Tall editorial card for experience pillars & local experiences.
 * Image with bottom scrim, eyebrow + title overlaid, optional body below.
 */
function ExperienceCard({
  image,
  eyebrow,
  title,
  description,
  overlay = true,
  height = 420,
  onClick,
  style = {}
}) {
  const [hover, setHover] = React.useState(false);
  if (overlay) {
    return /*#__PURE__*/React.createElement("article", {
      onClick: onClick,
      onMouseEnter: () => setHover(true),
      onMouseLeave: () => setHover(false),
      style: {
        position: 'relative',
        height,
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: 'var(--shadow-sm)',
        ...style
      }
    }, /*#__PURE__*/React.createElement("img", {
      src: image,
      alt: title,
      style: {
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        transition: 'transform var(--dur-image) var(--ease-out)',
        transform: hover ? 'scale(1.05)' : 'scale(1)'
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        inset: 0,
        background: 'var(--scrim-bottom)'
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        padding: 'var(--space-6)'
      }
    }, eyebrow && /*#__PURE__*/React.createElement("p", {
      style: {
        margin: '0 0 8px',
        fontFamily: 'var(--font-display)',
        fontSize: '12px',
        fontWeight: 500,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'var(--terra-300)'
      }
    }, eyebrow), /*#__PURE__*/React.createElement("h3", {
      style: {
        margin: 0,
        fontFamily: 'var(--font-display)',
        fontWeight: 300,
        fontSize: '28px',
        color: 'var(--paper)',
        lineHeight: 1.12
      }
    }, title), description && /*#__PURE__*/React.createElement("p", {
      style: {
        margin: '10px 0 0',
        fontSize: '14.5px',
        lineHeight: 1.55,
        color: 'var(--stone-200)',
        maxWidth: '38ch'
      }
    }, description)));
  }
  return /*#__PURE__*/React.createElement("article", {
    onClick: onClick,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      cursor: onClick ? 'pointer' : 'default',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      aspectRatio: '3 / 4',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: image,
    alt: title,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  })), eyebrow && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontSize: '12px',
      fontWeight: 500,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: 'var(--color-brand)'
    }
  }, eyebrow), /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontWeight: 400,
      fontSize: '22px',
      color: 'var(--text-strong)',
      lineHeight: 1.2
    }
  }, title), description && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: '15px',
      lineHeight: 1.6,
      color: 'var(--text-body)'
    }
  }, description));
}
Object.assign(__ds_scope, { ExperienceCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/ExperienceCard.jsx", error: String((e && e.message) || e) }); }

// components/cards/PropertyCard.jsx
try { (() => {
/**
 * Casa da Lapa — PropertyCard
 * Editorial listing card: image, overlay badge, title, meta, price.
 */
function PropertyCard({
  image,
  badge,
  title,
  location,
  price,
  unit = 'night',
  rating,
  ratingCount,
  tags = [],
  onClick,
  style = {}
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("article", {
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--color-surface-raised)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      border: '1px solid var(--border-hairline)',
      boxShadow: hover ? 'var(--shadow-md)' : 'var(--shadow-sm)',
      transition: 'box-shadow var(--dur-base) var(--ease-out), transform var(--dur-base) var(--ease-out)',
      transform: hover ? 'translateY(-3px)' : 'none',
      cursor: onClick ? 'pointer' : 'default',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      aspectRatio: '4 / 3',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: image,
    alt: title,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      transition: 'transform var(--dur-image) var(--ease-out)',
      transform: hover ? 'scale(1.04)' : 'scale(1)'
    }
  }), badge && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 14,
      left: 14,
      background: 'var(--color-surface-raised)',
      color: 'var(--stone-800)',
      fontFamily: 'var(--font-display)',
      fontSize: '11.5px',
      fontWeight: 500,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      padding: '6px 12px',
      borderRadius: 'var(--radius-pill)'
    }
  }, badge)), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--space-5)',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 400,
      fontSize: '20px',
      color: 'var(--text-strong)',
      margin: 0,
      lineHeight: 1.2
    }
  }, title), rating != null && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      flex: 'none'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "var(--terra-500)"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M12 2.5l2.9 5.9 6.5.95-4.7 4.58 1.1 6.47L12 17.4l-5.8 3.05 1.1-6.47L2.6 9.35l6.5-.95z"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 500,
      fontSize: '14px',
      color: 'var(--text-strong)'
    }
  }, rating), ratingCount != null && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '13px',
      color: 'var(--text-muted)'
    }
  }, "(", ratingCount, ")"))), location && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: '14px',
      color: 'var(--text-muted)'
    }
  }, location), tags.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 7,
      marginTop: 2
    }
  }, tags.map(t => /*#__PURE__*/React.createElement("span", {
    key: t,
    style: {
      fontSize: '12.5px',
      color: 'var(--stone-600)',
      border: '1px solid var(--border-soft)',
      borderRadius: 'var(--radius-pill)',
      padding: '4px 11px'
    }
  }, t))), price != null && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '6px 0 0',
      color: 'var(--text-strong)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 500,
      fontSize: '20px'
    }
  }, price), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '14px',
      color: 'var(--text-muted)'
    }
  }, " / ", unit))));
}
Object.assign(__ds_scope, { PropertyCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/PropertyCard.jsx", error: String((e && e.message) || e) }); }

// components/cards/TrailCard.jsx
try { (() => {
/**
 * Casa da Lapa — TrailCard
 * Hiking / nature attraction card with mono stat row.
 */
function TrailCard({
  image,
  title,
  distance,
  difficulty = 'Moderate',
  duration,
  description,
  onClick,
  style = {}
}) {
  const [hover, setHover] = React.useState(false);
  const Stat = ({
    label,
    value
  }) => /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: '10px',
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: 'var(--text-faint)'
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: '15px',
      fontWeight: 500,
      color: 'var(--text-strong)'
    }
  }, value));
  return /*#__PURE__*/React.createElement("article", {
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--color-surface-raised)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      border: '1px solid var(--border-hairline)',
      boxShadow: hover ? 'var(--shadow-md)' : 'var(--shadow-sm)',
      transition: 'box-shadow var(--dur-base) var(--ease-out)',
      cursor: onClick ? 'pointer' : 'default',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      aspectRatio: '16 / 10',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: image,
    alt: title,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      transition: 'transform var(--dur-image) var(--ease-out)',
      transform: hover ? 'scale(1.04)' : 'scale(1)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 14,
      left: 14,
      background: 'rgba(26,25,23,0.55)',
      backdropFilter: 'blur(6px)',
      color: 'var(--paper)',
      fontFamily: 'var(--font-display)',
      fontSize: '11.5px',
      fontWeight: 500,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      padding: '5px 11px',
      borderRadius: 'var(--radius-pill)'
    }
  }, difficulty)), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--space-5)',
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontWeight: 400,
      fontSize: '21px',
      color: 'var(--text-strong)',
      lineHeight: 1.2
    }
  }, title), description && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: '14.5px',
      lineHeight: 1.6,
      color: 'var(--text-body)'
    }
  }, description), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 28,
      paddingTop: 6,
      borderTop: '1px solid var(--border-hairline)',
      marginTop: 2
    }
  }, distance && /*#__PURE__*/React.createElement(Stat, {
    label: "Distance",
    value: distance
  }), duration && /*#__PURE__*/React.createElement(Stat, {
    label: "Duration",
    value: duration
  }))));
}
Object.assign(__ds_scope, { TrailCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/TrailCard.jsx", error: String((e && e.message) || e) }); }

// components/content/FaqItem.jsx
try { (() => {
/**
 * Casa da Lapa — FaqItem
 * Quiet accordion row. Controlled or uncontrolled.
 */
function FaqItem({
  question,
  children,
  open,
  defaultOpen = false,
  onToggle,
  style = {}
}) {
  const [internal, setInternal] = React.useState(defaultOpen);
  const isOpen = open !== undefined ? open : internal;
  const toggle = () => {
    if (open === undefined) setInternal(v => !v);
    onToggle && onToggle(!isOpen);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      borderBottom: '1px solid var(--border-hairline)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: toggle,
    "aria-expanded": isOpen,
    style: {
      all: 'unset',
      boxSizing: 'border-box',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      width: '100%',
      cursor: 'pointer',
      padding: '20px 2px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 400,
      fontSize: '18px',
      color: 'var(--text-strong)'
    }
  }, question), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 'none',
      display: 'inline-flex',
      color: 'var(--color-brand)',
      transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
      transition: 'transform var(--dur-base) var(--ease-out)'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "20",
    height: "20",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.6",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M12 5v14M5 12h14"
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateRows: isOpen ? '1fr' : '0fr',
      transition: 'grid-template-rows var(--dur-base) var(--ease-out)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 2px 22px',
      fontSize: '15px',
      lineHeight: 1.65,
      color: 'var(--text-body)',
      maxWidth: '62ch'
    }
  }, children))));
}
Object.assign(__ds_scope, { FaqItem });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/FaqItem.jsx", error: String((e && e.message) || e) }); }

// components/content/Highlight.jsx
try { (() => {
/**
 * Casa da Lapa — Highlight
 * Property highlight / experience pillar: icon, title, short description.
 */
function Highlight({
  icon,
  title,
  description,
  align = 'left',
  style = {}
}) {
  const centered = align === 'center';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      alignItems: centered ? 'center' : 'flex-start',
      textAlign: centered ? 'center' : 'left',
      ...style
    }
  }, icon && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 48,
      height: 48,
      borderRadius: 'var(--radius-md)',
      background: 'var(--terra-50)',
      color: 'var(--color-brand)'
    }
  }, icon), /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontWeight: 400,
      fontSize: '19px',
      color: 'var(--text-strong)',
      lineHeight: 1.25
    }
  }, title), description && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: '14.5px',
      lineHeight: 1.6,
      color: 'var(--text-body)',
      maxWidth: '34ch'
    }
  }, description));
}
Object.assign(__ds_scope, { Highlight });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/Highlight.jsx", error: String((e && e.message) || e) }); }

// components/content/Testimonial.jsx
try { (() => {
/**
 * Casa da Lapa — Testimonial
 * Editorial guest quote. Large light display type.
 */
function Testimonial({
  quote,
  author,
  origin,
  rating,
  avatar,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("figure", {
    style: {
      margin: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-5)',
      ...style
    }
  }, rating != null && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      gap: 3
    }
  }, Array.from({
    length: 5
  }).map((_, i) => /*#__PURE__*/React.createElement("svg", {
    key: i,
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: i < rating ? 'var(--terra-500)' : 'var(--stone-300)'
  }, /*#__PURE__*/React.createElement("path", {
    d: "M12 2.5l2.9 5.9 6.5.95-4.7 4.58 1.1 6.47L12 17.4l-5.8 3.05 1.1-6.47L2.6 9.35l6.5-.95z"
  })))), /*#__PURE__*/React.createElement("blockquote", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontWeight: 300,
      fontSize: '24px',
      lineHeight: 1.4,
      color: 'var(--text-strong)',
      letterSpacing: '-0.005em'
    }
  }, "\u201C", quote, "\u201D"), /*#__PURE__*/React.createElement("figcaption", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14
    }
  }, avatar && /*#__PURE__*/React.createElement("img", {
    src: avatar,
    alt: author,
    style: {
      width: 44,
      height: 44,
      borderRadius: '50%',
      objectFit: 'cover'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 500,
      fontSize: '15px',
      color: 'var(--text-strong)'
    }
  }, author), origin && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '13.5px',
      color: 'var(--text-muted)'
    }
  }, origin))));
}
Object.assign(__ds_scope, { Testimonial });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/Testimonial.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Casa da Lapa — Badge
 * Small status marker. Soft tints by default.
 */
function Badge({
  tone = 'neutral',
  solid = false,
  children,
  style = {},
  ...rest
}) {
  const tones = {
    neutral: {
      soft: ['var(--stone-100)', 'var(--stone-700)'],
      solid: ['var(--stone-700)', 'var(--white)']
    },
    brand: {
      soft: ['var(--terra-50)', 'var(--terra-700)'],
      solid: ['var(--color-brand)', 'var(--white)']
    },
    forest: {
      soft: ['#E4EAE0', 'var(--forest-700)'],
      solid: ['var(--forest-600)', 'var(--white)']
    },
    ocean: {
      soft: ['#DEE8EC', 'var(--ocean-700)'],
      solid: ['var(--ocean-600)', 'var(--white)']
    },
    sunset: {
      soft: ['#FBEBDD', '#9A511F'],
      solid: ['var(--sunset-500)', 'var(--white)']
    }
  };
  const [bg, fg] = tones[tone][solid ? 'solid' : 'soft'];
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      background: bg,
      color: fg,
      fontFamily: 'var(--font-display)',
      fontSize: '11.5px',
      fontWeight: 500,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      padding: '5px 11px',
      borderRadius: 'var(--radius-pill)',
      lineHeight: 1,
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Badge.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Rating.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Casa da Lapa — Rating
 * Terracotta star rating with optional count label.
 */
function Rating({
  value = 5,
  max = 5,
  count,
  size = 16,
  showValue = false,
  style = {},
  ...rest
}) {
  const Star = ({
    fill
  }) => /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    style: {
      display: 'block'
    }
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
    id: `s${fill}`
  }, /*#__PURE__*/React.createElement("stop", {
    offset: `${fill * 100}%`,
    stopColor: "var(--terra-500)"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: `${fill * 100}%`,
    stopColor: "var(--stone-300)"
  }))), /*#__PURE__*/React.createElement("path", {
    d: "M12 2.5l2.9 5.9 6.5.95-4.7 4.58 1.1 6.47L12 17.4l-5.8 3.05 1.1-6.47L2.6 9.35l6.5-.95z",
    fill: fill <= 0 ? 'var(--stone-300)' : fill >= 1 ? 'var(--terra-500)' : `url(#s${fill})`
  }));
  const stars = Array.from({
    length: max
  }, (_, i) => Math.max(0, Math.min(1, value - i)));
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      gap: '2px'
    }
  }, stars.map((f, i) => /*#__PURE__*/React.createElement(Star, {
    key: i,
    fill: f
  }))), showValue && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 500,
      fontSize: '14px',
      color: 'var(--text-strong)'
    }
  }, value.toFixed(1)), count != null && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '13px',
      color: 'var(--text-muted)'
    }
  }, "(", count, ")"));
}
Object.assign(__ds_scope, { Rating });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Rating.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Tag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Casa da Lapa — Tag
 * Outline chip for amenities & features. Optional leading icon.
 */
function Tag({
  icon = null,
  children,
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      background: 'transparent',
      color: 'var(--stone-700)',
      border: '1px solid var(--border-soft)',
      fontFamily: 'var(--font-body)',
      fontSize: '13.5px',
      padding: '7px 14px',
      borderRadius: 'var(--radius-pill)',
      lineHeight: 1,
      ...style
    }
  }, rest), icon && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      color: 'var(--stone-500)'
    }
  }, icon), children);
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Tag.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Casa da Lapa — Checkbox
 * Square checkbox with terracotta fill.
 */
function Checkbox({
  label,
  checked,
  defaultChecked,
  disabled = false,
  onChange,
  id,
  style = {},
  ...rest
}) {
  const fieldId = id || React.useId();
  const [internal, setInternal] = React.useState(defaultChecked || false);
  const isChecked = checked !== undefined ? checked : internal;
  const toggle = e => {
    if (disabled) return;
    if (checked === undefined) setInternal(e.target.checked);
    onChange && onChange(e);
  };
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: fieldId,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '11px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      display: 'inline-flex',
      flex: 'none'
    }
  }, /*#__PURE__*/React.createElement("input", _extends({
    id: fieldId,
    type: "checkbox",
    checked: isChecked,
    disabled: disabled,
    onChange: toggle,
    style: {
      position: 'absolute',
      opacity: 0,
      width: 20,
      height: 20,
      margin: 0,
      cursor: 'inherit'
    }
  }, rest)), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 20,
      height: 20,
      borderRadius: 'var(--radius-xs)',
      border: `1.5px solid ${isChecked ? 'var(--color-brand)' : 'var(--border-strong)'}`,
      background: isChecked ? 'var(--color-brand)' : 'var(--white)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out)'
    }
  }, isChecked && /*#__PURE__*/React.createElement("svg", {
    width: "12",
    height: "12",
    viewBox: "0 0 24 24",
    fill: "none"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M5 12l5 5L19 7",
    stroke: "var(--white)",
    strokeWidth: "2.4",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  })))), label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: '15px',
      color: 'var(--text-body)'
    }
  }, label));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Casa da Lapa — Input
 * Calm text field. Stone hairline, terracotta focus, square corners.
 */
function Input({
  label,
  type = 'text',
  placeholder,
  value,
  defaultValue,
  helper,
  error,
  iconLeft = null,
  disabled = false,
  required = false,
  onChange,
  id,
  style = {},
  ...rest
}) {
  const [focused, setFocused] = React.useState(false);
  const fieldId = id || React.useId();
  const borderColor = error ? 'var(--color-danger)' : focused ? 'var(--color-brand)' : 'var(--border-soft)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '7px',
      width: '100%',
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: fieldId,
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: '12px',
      fontWeight: 500,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: 'var(--text-muted)'
    }
  }, label, required && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--color-brand)'
    }
  }, " *")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      background: disabled ? 'var(--stone-100)' : 'var(--white)',
      border: `1.5px solid ${borderColor}`,
      borderRadius: 'var(--radius-sm)',
      padding: '0 14px',
      transition: 'border-color var(--dur-base) var(--ease-out)',
      boxShadow: focused && !error ? '0 0 0 3px var(--terra-50)' : 'none'
    }
  }, iconLeft && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-faint)',
      display: 'inline-flex'
    }
  }, iconLeft), /*#__PURE__*/React.createElement("input", _extends({
    id: fieldId,
    type: type,
    placeholder: placeholder,
    value: value,
    defaultValue: defaultValue,
    disabled: disabled,
    required: required,
    onChange: onChange,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    style: {
      flex: 1,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      fontFamily: 'var(--font-body)',
      fontSize: '15px',
      color: 'var(--text-strong)',
      padding: '12px 0',
      minWidth: 0
    }
  }, rest))), (helper || error) && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '12.5px',
      color: error ? 'var(--color-danger)' : 'var(--text-faint)'
    }
  }, error || helper));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Casa da Lapa — Select
 * Styled native select with a custom chevron.
 */
function Select({
  label,
  options = [],
  value,
  defaultValue,
  placeholder,
  helper,
  error,
  disabled = false,
  required = false,
  onChange,
  id,
  style = {},
  ...rest
}) {
  const [focused, setFocused] = React.useState(false);
  const fieldId = id || React.useId();
  const borderColor = error ? 'var(--color-danger)' : focused ? 'var(--color-brand)' : 'var(--border-soft)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '7px',
      width: '100%',
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: fieldId,
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: '12px',
      fontWeight: 500,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: 'var(--text-muted)'
    }
  }, label, required && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--color-brand)'
    }
  }, " *")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("select", _extends({
    id: fieldId,
    value: value,
    defaultValue: defaultValue,
    disabled: disabled,
    required: required,
    onChange: onChange,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    style: {
      appearance: 'none',
      WebkitAppearance: 'none',
      width: '100%',
      background: disabled ? 'var(--stone-100)' : 'var(--white)',
      border: `1.5px solid ${borderColor}`,
      borderRadius: 'var(--radius-sm)',
      padding: '13px 40px 13px 14px',
      fontFamily: 'var(--font-body)',
      fontSize: '15px',
      color: value || defaultValue ? 'var(--text-strong)' : 'var(--text-faint)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      outline: 'none',
      boxShadow: focused && !error ? '0 0 0 3px var(--terra-50)' : 'none',
      transition: 'border-color var(--dur-base) var(--ease-out)'
    }
  }, rest), placeholder && /*#__PURE__*/React.createElement("option", {
    value: "",
    disabled: true
  }, placeholder), options.map(o => {
    const opt = typeof o === 'string' ? {
      value: o,
      label: o
    } : o;
    return /*#__PURE__*/React.createElement("option", {
      key: opt.value,
      value: opt.value
    }, opt.label);
  })), /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    style: {
      position: 'absolute',
      right: 14,
      pointerEvents: 'none',
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M6 9l6 6 6-6",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }))), (helper || error) && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '12.5px',
      color: error ? 'var(--color-danger)' : 'var(--text-faint)'
    }
  }, error || helper));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Chrome.jsx
try { (() => {
/* Casa da Lapa — site chrome: top nav + footer. Exports to window. */

function SiteNav({
  route,
  onNavigate,
  solid
}) {
  const {
    IconButton
  } = window.ACasaDaLapaDesignSystem_6d5c43;
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const el = document.getElementById('kit-scroll');
    if (!el) return;
    const onScroll = () => setScrolled(el.scrollTop > 40);
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);
  const opaque = solid || scrolled;
  const links = [['home', 'Home'], ['house', 'The House'], ['experiences', 'Experiences'], ['journal', 'Journal']];
  const ink = opaque ? 'var(--text-strong)' : 'var(--paper)';
  return /*#__PURE__*/React.createElement("header", {
    style: {
      position: 'sticky',
      top: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 clamp(20px, 5vw, 56px)',
      height: 76,
      background: opaque ? 'rgba(244,240,233,0.92)' : 'transparent',
      backdropFilter: opaque ? 'blur(12px)' : 'none',
      borderBottom: opaque ? '1px solid var(--border-hairline)' : '1px solid transparent',
      transition: 'background var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out)'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => onNavigate('home'),
    style: {
      all: 'unset',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo/casa-da-lapa-mark.png",
    alt: "",
    style: {
      height: 34,
      filter: opaque ? 'none' : 'brightness(0) invert(1)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 500,
      fontSize: 15,
      letterSpacing: '0.22em',
      textTransform: 'uppercase',
      color: ink
    }
  }, "Casa da Lapa")), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'clamp(18px, 3vw, 38px)'
    }
  }, links.map(([id, label]) => /*#__PURE__*/React.createElement("button", {
    key: id,
    onClick: () => onNavigate(id),
    style: {
      all: 'unset',
      cursor: 'pointer',
      fontFamily: 'var(--font-display)',
      fontSize: 14,
      letterSpacing: '0.04em',
      color: route === id ? 'var(--color-brand)' : ink,
      opacity: route === id ? 1 : 0.86,
      borderBottom: route === id ? '1.5px solid var(--color-brand)' : '1.5px solid transparent',
      paddingBottom: 3
    }
  }, label))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 13,
      letterSpacing: '0.08em',
      color: ink,
      opacity: 0.8
    }
  }, "PT \xB7 EN"), /*#__PURE__*/React.createElement("button", {
    onClick: () => onNavigate('house'),
    style: {
      all: 'unset',
      cursor: 'pointer',
      background: 'var(--color-brand)',
      color: 'var(--white)',
      fontFamily: 'var(--font-display)',
      fontWeight: 500,
      fontSize: 14,
      padding: '11px 22px',
      borderRadius: 'var(--radius-sm)'
    }
  }, "Book your stay")));
}
function SiteFooter({
  onNavigate
}) {
  const cols = [['Explore', ['The House', 'Experiences', 'Journal', 'Gallery']], ['Practical', ['Availability', 'Getting here', 'House rules', 'FAQ']], ['Serreta', ['Hiking trails', 'Natural pools', 'Santa Bárbara', 'The chapel']]];
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      background: 'var(--basalt-900)',
      color: 'var(--paper)',
      padding: '72px clamp(20px,5vw,56px) 40px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.6fr 1fr 1fr 1fr',
      gap: 40,
      maxWidth: 1240,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo/casa-da-lapa-mark.png",
    alt: "",
    style: {
      height: 40,
      filter: 'brightness(0) invert(1)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 500,
      fontSize: 16,
      letterSpacing: '0.22em',
      textTransform: 'uppercase'
    }
  }, "Casa da Lapa")), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontWeight: 300,
      fontSize: 24,
      lineHeight: 1.3,
      maxWidth: '20ch',
      color: 'var(--paper)'
    }
  }, "Relax between forest and sea."), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '20px 0 0',
      fontSize: 14,
      color: 'var(--stone-300)',
      lineHeight: 1.6
    }
  }, "Serreta, Angra do Hero\xEDsmo", /*#__PURE__*/React.createElement("br", null), "Terceira \xB7 Azores \xB7 Portugal")), cols.map(([title, items]) => /*#__PURE__*/React.createElement("div", {
    key: title
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '0 0 16px',
      fontFamily: 'var(--font-display)',
      fontSize: 12,
      fontWeight: 500,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: 'var(--terra-300)'
    }
  }, title), /*#__PURE__*/React.createElement("ul", {
    style: {
      listStyle: 'none',
      margin: 0,
      padding: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 11
    }
  }, items.map(i => /*#__PURE__*/React.createElement("li", {
    key: i
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => onNavigate && onNavigate('home'),
    style: {
      all: 'unset',
      cursor: 'pointer',
      fontSize: 14.5,
      color: 'var(--stone-200)'
    }
  }, i))))))), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1240,
      margin: '48px auto 0',
      paddingTop: 24,
      borderTop: '1px solid var(--border-on-dark)',
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 13,
      color: 'var(--stone-400)'
    }
  }, /*#__PURE__*/React.createElement("span", null, "\xA9 2026 Casa da Lapa"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)'
    }
  }, "38.7621\xB0 N \xB7 27.3760\xB0 W")));
}
Object.assign(window, {
  SiteNav,
  SiteFooter
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Chrome.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/ExperiencesScreen.jsx
try { (() => {
/* Casa da Lapa — Experiences screen. Exports ExperiencesScreen. */

function ExperiencesScreen({
  onNavigate
}) {
  const NS = window.ACasaDaLapaDesignSystem_6d5c43;
  const {
    TrailCard,
    ExperienceCard,
    Button
  } = NS;
  const A = '../../assets/photography/';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      paddingTop: 76
    }
  }, /*#__PURE__*/React.createElement("section", {
    style: {
      maxWidth: 1240,
      margin: '0 auto',
      padding: 'clamp(40px,6vw,88px) clamp(20px,5vw,56px) 0'
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '0 0 16px',
      fontFamily: 'var(--font-display)',
      fontSize: 12,
      fontWeight: 500,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: 'var(--color-brand)'
    }
  }, "Nature & Hiking"), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontWeight: 300,
      fontSize: 'clamp(36px,5.5vw,64px)',
      lineHeight: 1.04,
      letterSpacing: '-0.01em',
      color: 'var(--text-strong)',
      maxWidth: '14ch'
    }
  }, "The island begins at the door."), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '22px 0 0',
      fontSize: 18,
      lineHeight: 1.7,
      color: 'var(--text-body)',
      maxWidth: '52ch'
    }
  }, "Western Terceira is the wild side \u2014 laurel forest, crater lakes, black-rock coast and natural pools. Here are the routes we walk most.")), /*#__PURE__*/React.createElement("section", {
    style: {
      maxWidth: 1240,
      margin: '0 auto',
      padding: 'clamp(40px,5vw,64px) clamp(20px,5vw,56px)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement(TrailCard, {
    image: A + 'exterior-facade.jpg',
    title: "Serreta \u2013 Lagoinha",
    distance: "6.8 km",
    difficulty: "Moderate",
    duration: "2h 30m",
    description: "A circular loop along the western flank of Santa B\xE1rbara, through endemic forest to the coast.",
    onClick: () => {}
  }), /*#__PURE__*/React.createElement(TrailCard, {
    image: A + 'interior-living.jpg',
    title: "Mist\xE9rios Negros",
    distance: "9.2 km",
    difficulty: "Hard",
    duration: "3h 45m",
    description: "Volcanic domes and high moorland in the island's green heart.",
    onClick: () => {}
  }), /*#__PURE__*/React.createElement(TrailCard, {
    image: A + 'bathroom-shower.png',
    title: "Coastal natural pools",
    distance: "3.1 km",
    difficulty: "Easy",
    duration: "1h 10m",
    description: "An easy walk to the black-basalt pools below Serreta.",
    onClick: () => {}
  }))), /*#__PURE__*/React.createElement("section", {
    style: {
      padding: 'clamp(40px,5vw,72px) clamp(20px,5vw,56px)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1240,
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement(ExperienceCard, {
    image: A + 'exterior-entrance.png',
    eyebrow: "Ocean Views & Sunsets",
    title: "The west-facing coast",
    description: "Some of the Azores' best sunsets fall over the Serreta lighthouse.",
    height: 420
  }), /*#__PURE__*/React.createElement(ExperienceCard, {
    image: A + 'interior-dining.jpg',
    eyebrow: "Slow Island Living",
    title: "A table, an oven, time",
    description: "Cook with what the island grows; eat late in the courtyard.",
    height: 420
  }))), /*#__PURE__*/React.createElement("section", {
    style: {
      position: 'relative',
      margin: '0 clamp(20px,5vw,56px) clamp(56px,8vw,112px)',
      borderRadius: 'var(--radius-xl)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: A + 'bedroom-seaview.jpg',
    alt: "",
    style: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'var(--scrim-full)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      padding: 'clamp(48px,7vw,96px) clamp(28px,5vw,72px)',
      textAlign: 'center',
      maxWidth: 720,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontWeight: 300,
      fontSize: 'clamp(28px,4vw,44px)',
      lineHeight: 1.12,
      color: 'var(--paper)',
      letterSpacing: '-0.01em'
    }
  }, "Stay where the trails begin."), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '16px 0 32px',
      fontSize: 17,
      color: 'var(--stone-200)'
    }
  }, "Two units, two beds each. Forest on one side, ocean on the other."), /*#__PURE__*/React.createElement(Button, {
    variant: "inverse",
    size: "lg",
    onClick: () => onNavigate('house')
  }, "Check availability"))));
}
Object.assign(window, {
  ExperiencesScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/ExperiencesScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/HomeScreen.jsx
try { (() => {
/* Casa da Lapa — Home screen. Exports HomeScreen to window. */

function HomeScreen({
  onNavigate
}) {
  const NS = window.ACasaDaLapaDesignSystem_6d5c43;
  const {
    BookingWidget,
    ExperienceCard,
    Testimonial,
    Highlight,
    Button
  } = NS;
  const A = '../../assets/photography/';
  const Ico = ({
    name,
    size = 22
  }) => {
    const ref = React.useRef(null);
    React.useEffect(() => {
      if (ref.current) ref.current.innerHTML = `<i data-lucide="${name}"></i>`;
      window.lucide && window.lucide.createIcons({
        attrs: {
          width: size,
          height: size
        }
      });
    }, [name]);
    return /*#__PURE__*/React.createElement("span", {
      ref: ref,
      style: {
        display: 'inline-flex'
      }
    });
  };
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("section", {
    style: {
      position: 'relative',
      height: '92vh',
      minHeight: 600,
      marginTop: -76
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: A + 'exterior-facade.jpg',
    alt: "",
    style: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(to bottom, rgba(26,25,23,0.36), rgba(26,25,23,0.12) 40%, rgba(26,25,23,0.55))'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      padding: '0 clamp(20px,5vw,56px) clamp(40px,6vw,72px)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1240,
      margin: '0 auto',
      width: '100%'
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '0 0 18px',
      fontFamily: 'var(--font-display)',
      fontSize: 13,
      fontWeight: 500,
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      color: 'var(--terra-300)'
    }
  }, "Serreta \xB7 Terceira \xB7 Azores"), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontWeight: 300,
      fontSize: 'clamp(44px, 7vw, 92px)',
      lineHeight: 1.02,
      letterSpacing: '-0.01em',
      color: 'var(--paper)',
      maxWidth: '15ch'
    }
  }, "Relax between forest and sea."), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '22px 0 0',
      fontSize: 19,
      lineHeight: 1.6,
      color: 'var(--stone-200)',
      maxWidth: '46ch'
    }
  }, "A restored volcanic-stone country house where the Mata da Serreta meets the Atlantic. Two quiet units, one long horizon."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 38,
      maxWidth: 760
    }
  }, /*#__PURE__*/React.createElement(BookingWidget, {
    layout: "bar",
    onSearch: () => onNavigate('house')
  }))))), /*#__PURE__*/React.createElement("section", {
    style: {
      padding: 'clamp(56px,8vw,128px) clamp(20px,5vw,56px)',
      maxWidth: 1240,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 'clamp(32px,6vw,96px)',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '0 0 16px',
      fontFamily: 'var(--font-display)',
      fontSize: 12,
      fontWeight: 500,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: 'var(--color-brand)'
    }
  }, "Casa da Lapa"), /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontWeight: 300,
      fontSize: 'clamp(30px,4vw,46px)',
      lineHeight: 1.12,
      color: 'var(--text-strong)',
      letterSpacing: '-0.01em'
    }
  }, "A traditional Azorean country house in Serreta."), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '24px 0 0',
      fontSize: 17,
      lineHeight: 1.75,
      color: 'var(--text-body)',
      maxWidth: '54ch'
    }
  }, "Rebuilt over a primitive rural house, Casa da Lapa keeps the original lines and the architectural value of traditional Serreta building \u2014 dry volcanic stone, deep-set windows, a courtyard and the old bread oven. Inside, calm contemporary rooms and warm natural light."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 32
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    onClick: () => onNavigate('house')
  }, "Discover the house"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: A + 'interior-living.jpg',
    alt: "",
    style: {
      width: '100%',
      height: 320,
      objectFit: 'cover',
      borderRadius: 'var(--radius-lg)',
      marginTop: 36
    }
  }), /*#__PURE__*/React.createElement("img", {
    src: A + 'bedroom-seaview.jpg',
    alt: "",
    style: {
      width: '100%',
      height: 320,
      objectFit: 'cover',
      borderRadius: 'var(--radius-lg)'
    }
  })))), /*#__PURE__*/React.createElement("section", {
    style: {
      background: 'var(--color-canvas-alt)',
      padding: 'clamp(56px,8vw,120px) clamp(20px,5vw,56px)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1240,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginBottom: 48,
      flexWrap: 'wrap',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '0 0 12px',
      fontFamily: 'var(--font-display)',
      fontSize: 12,
      fontWeight: 500,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: 'var(--color-brand)'
    }
  }, "Experience Pillars"), /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontWeight: 300,
      fontSize: 'clamp(28px,3.5vw,42px)',
      color: 'var(--text-strong)',
      letterSpacing: '-0.01em'
    }
  }, "Five ways to slow down"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement(ExperienceCard, {
    image: A + 'exterior-entrance.png',
    eyebrow: "Nature & Hiking",
    title: "Into the Mata da Serreta",
    description: "Trailheads minutes from the door.",
    height: 440,
    onClick: () => onNavigate('experiences')
  }), /*#__PURE__*/React.createElement(ExperienceCard, {
    image: A + 'interior-dining.jpg',
    eyebrow: "Azorean Heritage",
    title: "Stone, oven & craft",
    description: "A house built the traditional way.",
    height: 440,
    onClick: () => onNavigate('house')
  }), /*#__PURE__*/React.createElement(ExperienceCard, {
    image: A + 'bathroom-stone.jpg',
    eyebrow: "Peace & Privacy",
    title: "Only two units",
    description: "The long quiet of the island.",
    height: 440,
    onClick: () => onNavigate('house')
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 32,
      marginTop: 56
    }
  }, /*#__PURE__*/React.createElement(Highlight, {
    icon: /*#__PURE__*/React.createElement(Ico, {
      name: "trees"
    }),
    title: "Forest at the door",
    description: "Endemic laurel woodland of western Terceira."
  }), /*#__PURE__*/React.createElement(Highlight, {
    icon: /*#__PURE__*/React.createElement(Ico, {
      name: "waves"
    }),
    title: "Ocean & sunsets",
    description: "West-facing over the Atlantic."
  }), /*#__PURE__*/React.createElement(Highlight, {
    icon: /*#__PURE__*/React.createElement(Ico, {
      name: "flame"
    }),
    title: "Traditional oven",
    description: "The original wood-fired bread oven."
  }), /*#__PURE__*/React.createElement(Highlight, {
    icon: /*#__PURE__*/React.createElement(Ico, {
      name: "moon"
    }),
    title: "Dark skies",
    description: "Stars far from any town light."
  })))), /*#__PURE__*/React.createElement("section", {
    style: {
      padding: 'clamp(64px,9vw,140px) clamp(20px,5vw,56px)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 880,
      margin: '0 auto',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement(Testimonial, {
    quote: "We woke to the Atlantic through deep-set stone windows, walked into the forest before breakfast, and never quite wanted to leave.",
    author: "Maria \xC1vila",
    origin: "Lisbon, Portugal",
    rating: 5,
    style: {
      alignItems: 'center'
    }
  }))));
}
Object.assign(window, {
  HomeScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/HomeScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/HouseScreen.jsx
try { (() => {
/* Casa da Lapa — The House screen with booking sidebar. Exports HouseScreen. */

function HouseScreen({
  onNavigate
}) {
  const NS = window.ACasaDaLapaDesignSystem_6d5c43;
  const {
    BookingWidget,
    Tag,
    Rating,
    Badge,
    FaqItem,
    Button
  } = NS;
  const A = '../../assets/photography/';
  const Ico = ({
    name,
    size = 16
  }) => {
    const ref = React.useRef(null);
    React.useEffect(() => {
      if (ref.current) ref.current.innerHTML = `<i data-lucide="${name}"></i>`;
      window.lucide && window.lucide.createIcons({
        attrs: {
          width: size,
          height: size
        }
      });
    }, [name]);
    return /*#__PURE__*/React.createElement("span", {
      ref: ref,
      style: {
        display: 'inline-flex'
      }
    });
  };
  const gallery = [A + 'bedroom-seaview.jpg', A + 'interior-living.jpg', A + 'bathroom-stone.jpg', A + 'bedroom-twin.jpg', A + 'interior-dining.jpg', A + 'bedroom-orange.png'];
  const amenities = [['waves', 'Sea view'], ['trees', 'Forest trail'], ['wifi', 'Wi-Fi'], ['flame', 'Bread oven'], ['utensils-crossed', 'Full kitchen'], ['car', 'Free parking'], ['wind', 'Wood stove'], ['dog', 'Dog friendly']];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      paddingTop: 76
    }
  }, /*#__PURE__*/React.createElement("section", {
    style: {
      maxWidth: 1240,
      margin: '0 auto',
      padding: 'clamp(28px,4vw,52px) clamp(20px,5vw,56px) 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "brand",
    solid: true
  }, "2 units"), /*#__PURE__*/React.createElement(Badge, {
    tone: "forest"
  }, "Available now")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      flexWrap: 'wrap',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontWeight: 300,
      fontSize: 'clamp(34px,5vw,56px)',
      lineHeight: 1.05,
      letterSpacing: '-0.01em',
      color: 'var(--text-strong)',
      maxWidth: '16ch'
    }
  }, "The stone house at Serreta"), /*#__PURE__*/React.createElement(Rating, {
    value: 4.9,
    count: 128,
    showValue: true
  }))), /*#__PURE__*/React.createElement("section", {
    style: {
      maxWidth: 1240,
      margin: '0 auto',
      padding: '28px clamp(20px,5vw,56px) 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '2fr 1fr 1fr',
      gridTemplateRows: '220px 220px',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: gallery[0],
    alt: "",
    style: {
      gridRow: 'span 2',
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      borderRadius: 'var(--radius-lg)'
    }
  }), gallery.slice(1, 5).map((g, i) => /*#__PURE__*/React.createElement("img", {
    key: i,
    src: g,
    alt: "",
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      borderRadius: 'var(--radius-md)'
    }
  })))), /*#__PURE__*/React.createElement("section", {
    style: {
      maxWidth: 1240,
      margin: '0 auto',
      padding: 'clamp(40px,6vw,80px) clamp(20px,5vw,56px)',
      display: 'grid',
      gridTemplateColumns: '1.7fr 1fr',
      gap: 'clamp(32px,5vw,72px)',
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontWeight: 300,
      fontSize: 'clamp(22px,2.6vw,30px)',
      lineHeight: 1.4,
      color: 'var(--text-strong)',
      letterSpacing: '-0.005em'
    }
  }, "Two independent units in a house rebuilt over a primitive rural home \u2014 original lines kept, contemporary calm within."), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '24px 0 0',
      fontSize: 16.5,
      lineHeight: 1.75,
      color: 'var(--text-body)',
      maxWidth: '60ch'
    }
  }, "Each unit sleeps two, with deep volcanic-stone walls that keep the rooms cool in summer and warm by the stove in winter. Wake to the Atlantic from the upper unit, or step straight into the courtyard and garden from the ground floor. The old wood-fired bread oven still stands in the yard."), /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: '48px 0 20px',
      fontFamily: 'var(--font-display)',
      fontWeight: 400,
      fontSize: 22,
      color: 'var(--text-strong)'
    }
  }, "What's here"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: 14
    }
  }, amenities.map(([icon, label]) => /*#__PURE__*/React.createElement("div", {
    key: label,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      fontSize: 15.5,
      color: 'var(--text-body)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--stone-500)',
      display: 'inline-flex'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    name: icon,
    size: 18
  })), label))), /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: '52px 0 8px',
      fontFamily: 'var(--font-display)',
      fontWeight: 400,
      fontSize: 22,
      color: 'var(--text-strong)'
    }
  }, "Good to know"), /*#__PURE__*/React.createElement(FaqItem, {
    question: "What time is check-in?",
    defaultOpen: true
  }, "Check-in is from 15:00, check-out by 11:00. Self check-in with a key box \u2014 we send the code the day before you arrive."), /*#__PURE__*/React.createElement(FaqItem, {
    question: "How do we get there?"
  }, "Casa da Lapa is about 30 minutes by car from Angra do Hero\xEDsmo and 40 from Lajes airport. A car is the easiest way to reach the trails and coast."), /*#__PURE__*/React.createElement(FaqItem, {
    question: "Is the whole house ours?"
  }, "You book a single unit; the two units share only the outdoor courtyard. For full privacy, book both.")), /*#__PURE__*/React.createElement("aside", {
    style: {
      position: 'sticky',
      top: 100
    }
  }, /*#__PURE__*/React.createElement(BookingWidget, {
    layout: "card",
    price: "\u20AC140",
    unit: "night",
    onSearch: () => {}
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Tag, {
    icon: /*#__PURE__*/React.createElement(Ico, {
      name: "shield-check"
    })
  }, "Free cancellation \xB7 7 days"), /*#__PURE__*/React.createElement(Tag, {
    icon: /*#__PURE__*/React.createElement(Ico, {
      name: "key"
    })
  }, "Self check-in")))));
}
Object.assign(window, {
  HouseScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/HouseScreen.jsx", error: String((e && e.message) || e) }); }

__ds_ns.BookingWidget = __ds_scope.BookingWidget;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.ExperienceCard = __ds_scope.ExperienceCard;

__ds_ns.PropertyCard = __ds_scope.PropertyCard;

__ds_ns.TrailCard = __ds_scope.TrailCard;

__ds_ns.FaqItem = __ds_scope.FaqItem;

__ds_ns.Highlight = __ds_scope.Highlight;

__ds_ns.Testimonial = __ds_scope.Testimonial;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Rating = __ds_scope.Rating;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Select = __ds_scope.Select;

})();
