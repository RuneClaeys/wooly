import type { Config } from 'tailwindcss';

export default {
   content: [],
   theme: {
      extend: {
         fontFamily: {
            sans: ['Poppins', 'sans-serif'],
         },
         fontSize: {
            xs: ['0.75rem', { lineHeight: '1rem' }],
            sm: ['0.875rem', { lineHeight: '1.25rem' }],
            base: ['1rem', { lineHeight: '1.5rem' }],
            lg: ['1.125rem', { lineHeight: '1.75rem' }],
            xl: ['1.25rem', { lineHeight: '1.75rem' }],
            '2xl': ['1.5rem', { lineHeight: '2rem' }],
            '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
            '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
         },
         colors: {
            success: {
               50: '#f0fdf4',
               100: '#dcfce7',
               500: '#10b981',
               600: '#059669',
               700: '#047857',
            },
            error: {
               50: '#fef2f2',
               100: '#fee2e2',
               500: '#ef4444',
               600: '#dc2626',
               700: '#b91c1c',
            },
            warning: {
               50: '#fffbeb',
               100: '#fef3c7',
               500: '#f59e0b',
               600: '#d97706',
               700: '#b45309',
            },
         },
         boxShadow: {
            'wooly-xs': '0 2px 8px rgba(236, 72, 153, 0.08)',
            'wooly-sm': '0 4px 12px rgba(236, 72, 153, 0.1)',
            'wooly-md': '0 8px 24px rgba(236, 72, 153, 0.12)',
            'wooly-lg': '0 12px 32px rgba(236, 72, 153, 0.15)',
         },
      },
   },
   plugins: [],
} satisfies Config;
