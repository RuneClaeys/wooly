export type DefaultLayoutProps = Partial<{
   title: string;
   root: boolean;
   navigateBackTo: string;
}>;

export const defaultLayoutProps = ref<DefaultLayoutProps>();

export function useDefaultLayout(layoutParams: () => DefaultLayoutProps) {
   const layoutProps = computed(layoutParams);

   const defaultValues: DefaultLayoutProps = {
      title: 'Wooly',
      root: true,
      navigateBackTo: '/',
   };

   function updateProps(props: DefaultLayoutProps) {
      defaultLayoutProps.value = { ...defaultValues, ...props };
   }

   const { pause, resume, stop } = watchPausable(layoutProps, updateProps);

   onActivated(async () => {
      await nextTick();
      resume();
      updateProps(layoutProps.value);
   });
   onMounted(async () => {
      await nextTick();
      resume();
      updateProps(layoutProps.value);
   });
   onDeactivated(pause);
   onBeforeUnmount(stop);
}
