<script setup lang="ts">
definePageMeta({
	redirect: (to) => `/projects/${String(to.params.id)}/overview`,
});
</script>
